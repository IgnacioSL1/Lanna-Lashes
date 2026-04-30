/**
 * Stripe webhook handler
 * POST /webhooks/stripe
 *
 * Handles:
 *   payment_intent.succeeded          → course enrollment
 *   customer.subscription.created     → activate mentorship
 *   customer.subscription.updated     → sync status / plan changes
 *   customer.subscription.deleted     → cancel mentorship
 *   invoice.payment_failed            → mark subscription past_due
 */
import { Router, Request, Response } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../services/db';
import { hubspot } from '../services/hubspot';
import { logger } from '../services/logger';

const router = Router();
const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      logger.warn(`Webhook signature failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {

        // ── Course purchase ─────────────────────────────────────────────────
        case 'payment_intent.succeeded': {
          const intent   = event.data.object as Stripe.PaymentIntent;
          const courseId = intent.metadata.courseId;
          const userId   = intent.metadata.userId;
          if (!courseId || !userId) break;

          const existing = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
          });
          if (!existing) {
            await prisma.$transaction([
              prisma.enrollment.create({
                data: { userId, courseId, stripePaymentIntentId: intent.id },
              }),
              prisma.course.update({
                where: { id: courseId },
                data:  { enrolledCount: { increment: 1 } },
              }),
            ]);
            const [user, course] = await Promise.all([
              prisma.user.findUnique({ where: { id: userId } }),
              prisma.course.findUnique({ where: { id: courseId } }),
            ]);
            if (user && course) {
              hubspot.trackEvent(user, 'course_purchased', {
                courseTitle: course.title,
                price: course.price / 100,
              }).catch(() => {});
            }
          }
          break;
        }

        // ── Mentorship subscription created ────────────────────────────────
        case 'customer.subscription.created': {
          const sub  = event.data.object as Stripe.Subscription;
          const userId = sub.metadata.userId;
          const plan   = sub.metadata.plan as string;
          if (!userId || !plan) break;

          await prisma.mentorshipSubscription.upsert({
            where:  { stripeSubscriptionId: sub.id },
            update: {
              status:            mapSubStatus(sub.status),
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd:   new Date(sub.current_period_end   * 1000),
              cancelAtPeriodEnd:  sub.cancel_at_period_end,
            },
            create: {
              userId,
              plan:               plan as any,
              status:             mapSubStatus(sub.status),
              stripeSubscriptionId: sub.id,
              stripeCustomerId:   sub.customer as string,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd:   new Date(sub.current_period_end   * 1000),
              cancelAtPeriodEnd:  sub.cancel_at_period_end,
            },
          });

          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            hubspot.trackEvent(user, 'mentorship_subscribed', { plan }).catch(() => {});
          }
          break;
        }

        // ── Mentorship subscription updated ────────────────────────────────
        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription;
          await prisma.mentorshipSubscription.updateMany({
            where: { stripeSubscriptionId: sub.id },
            data:  {
              status:            mapSubStatus(sub.status),
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd:   new Date(sub.current_period_end   * 1000),
              cancelAtPeriodEnd:  sub.cancel_at_period_end,
            },
          });
          break;
        }

        // ── Mentorship subscription canceled ───────────────────────────────
        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          await prisma.mentorshipSubscription.updateMany({
            where: { stripeSubscriptionId: sub.id },
            data:  { status: 'canceled', cancelAtPeriodEnd: false },
          });
          const record = await prisma.mentorshipSubscription.findFirst({
            where: { stripeSubscriptionId: sub.id },
            include: { user: true },
          });
          if (record?.user) {
            hubspot.trackEvent(record.user, 'mentorship_canceled', {}).catch(() => {});
          }
          break;
        }

        // ── Payment failed ─────────────────────────────────────────────────
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const subId   = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;
          if (subId) {
            await prisma.mentorshipSubscription.updateMany({
              where: { stripeSubscriptionId: subId },
              data:  { status: 'past_due' },
            });
          }
          break;
        }
      }
    } catch (err) {
      logger.error({ err, event: event.type });
      return res.status(500).send('Webhook processing failed');
    }

    res.sendStatus(200);
  }
);

function mapSubStatus(status: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' | 'trialing' {
  if (status === 'active')   return 'active';
  if (status === 'past_due') return 'past_due';
  if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') return 'canceled';
  if (status === 'trialing') return 'trialing';
  return 'canceled';
}

export default router;
