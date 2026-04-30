/**
 * Stripe webhook handler
 * POST /webhooks/stripe
 *
 * Handles:
 *   payment_intent.succeeded → create enrollment, trigger HubSpot
 */
import { Router, Request, Response } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../services/db';
import { hubspot } from '../services/hubspot';
import { logger } from '../services/logger';

const router = Router();
const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      logger.warn(`Webhook signature failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent   = event.data.object as Stripe.PaymentIntent;
      const courseId = intent.metadata.courseId;
      const userId   = intent.metadata.userId;
      if (!courseId || !userId) return res.sendStatus(200);

      try {
        // Create enrollment (idempotent)
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

          // HubSpot event
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
      } catch (err) {
        logger.error({ err, event: event.type });
        return res.status(500).send('Enrollment creation failed');
      }
    }

    res.sendStatus(200);
  }
);

export default router;
