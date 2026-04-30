/**
 * Payments — Stripe PaymentIntent for course purchases
 * POST /api/payments/create-intent
 */
import { Router, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../services/db';
import { authenticate, AuthRequest } from '../middleware/auth';

export const paymentsRouter = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

paymentsRouter.post('/create-intent', authenticate, async (req: AuthRequest, res: Response) => {
  const { courseId, amount, currency = 'usd' } = req.body;

  // Verify course exists
  const course = await prisma.course.findUnique({ where: { id: courseId, published: true } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  // Check not already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.userId!, courseId } },
  });
  if (existing) return res.status(409).json({ error: 'Already enrolled in this course' });

  // Get or create Stripe customer
  let user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name:  `${user.firstName} ${user.lastName}`,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
  }

  // Create ephemeral key for PaymentSheet
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: stripeCustomerId },
    { apiVersion: '2024-04-10' }
  );

  // Create PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount:   course.price,  // already in cents
    currency,
    customer: stripeCustomerId,
    automatic_payment_methods: { enabled: true },
    metadata: { courseId, userId: req.userId! },
  });

  res.json({
    clientSecret:  paymentIntent.client_secret,
    ephemeralKey:  ephemeralKey.secret,
    customerId:    stripeCustomerId,
  });
});

export default paymentsRouter;

// ─── Shopify order proxy ──────────────────────────────────────────────────────
// GET /api/shopify/orders
// Fetches order history for the authenticated user from Shopify Customer Account API

import { Router as ShopifyRouter, Response as ShopifyRes } from 'express';
export const shopifyRouter = ShopifyRouter();

shopifyRouter.get('/orders', authenticate, async (req: AuthRequest, res: ShopifyRes) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.shopifyCustomerId) return res.json([]);

  const query = `
    query CustomerOrders($customerId: ID!) {
      customer(id: $customerId) {
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id name processedAt financialStatus fulfillmentStatus
              totalPriceV2 { amount currencyCode }
              lineItems(first: 10) {
                edges {
                  node {
                    title quantity
                    variant {
                      title price { amount currencyCode }
                      image { url }
                    }
                  }
                }
              }
              fulfillments {
                trackingInfo { url }
              }
            }
          }
        }
      }
    }
  `;

  const resp = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN!,
      },
      body: JSON.stringify({ query, variables: { customerId: user.shopifyCustomerId } }),
    }
  );
  const data = await resp.json() as any;
  const orders = data.data?.customer?.orders?.edges?.map((e: any) => {
    const o = e.node;
    return {
      id:                o.id,
      orderNumber:       o.name.replace('#', ''),
      processedAt:       o.processedAt,
      financialStatus:   o.financialStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      totalPrice:        o.totalPriceV2.amount,
      currencyCode:      o.totalPriceV2.currencyCode,
      lineItems:         o.lineItems.edges.map((le: any) => ({
        id:           le.node.variant?.id ?? le.node.title,
        title:        le.node.title,
        variantTitle: le.node.variant?.title,
        quantity:     le.node.quantity,
        price:        le.node.variant?.price?.amount ?? '0',
        imageUrl:     le.node.variant?.image?.url ?? null,
      })),
      trackingUrl: o.fulfillments?.[0]?.trackingInfo?.[0]?.url ?? null,
    };
  }) ?? [];

  res.json(orders);
});
