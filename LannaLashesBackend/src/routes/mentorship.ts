/**
 * Mentorship routes
 * GET  /api/mentorship/plans        — list pricing plans
 * GET  /api/mentorship/subscription — current user's subscription
 * POST /api/mentorship/checkout     — create Stripe checkout session
 * POST /api/mentorship/portal       — Stripe billing portal URL
 * GET  /api/mentorship/videos       — weekly videos (members only)
 * GET  /api/mentorship/calls        — monthly calls (members only)
 * POST /api/mentorship/calls        — admin: create a call
 * PUT  /api/mentorship/calls/:id    — admin: update call (add meet/recording URL)
 */
import { Router, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../services/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logger } from '../services/logger';

export const mentorshipRouter = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

// ── Plan definitions ──────────────────────────────────────────────────────────

export const PLANS = {
  monthly: {
    id:          'monthly',
    name:        'Monthly',
    price:       8700,    // $87.00 in cents
    interval:    'month' as const,
    intervalCount: 1,
    label:       '$87 / month',
    badge:       null,
    stripePriceEnvKey: 'STRIPE_MENTORSHIP_PRICE_MONTHLY',
  },
  biannual: {
    id:          'biannual',
    name:        '6 Months',
    price:       43500,   // $435.00 in cents
    interval:    'month' as const,
    intervalCount: 6,
    label:       '$435 / 6 months',
    badge:       'Save $87',
    stripePriceEnvKey: 'STRIPE_MENTORSHIP_PRICE_BIANNUAL',
  },
  annual: {
    id:          'annual',
    name:        'Annual',
    price:       87000,   // $870.00 in cents
    interval:    'year' as const,
    intervalCount: 1,
    label:       '$870 / year',
    badge:       'Save $174',
    stripePriceEnvKey: 'STRIPE_MENTORSHIP_PRICE_ANNUAL',
  },
};

// ── Helper: verify active membership ─────────────────────────────────────────

async function requireMembership(req: AuthRequest, res: Response): Promise<boolean> {
  const sub = await prisma.mentorshipSubscription.findUnique({
    where: { userId: req.userId! },
  });
  if (!sub || sub.status !== 'active') {
    res.status(403).json({ error: 'Active mentorship subscription required' });
    return false;
  }
  return true;
}

// ── GET /api/mentorship/plans ─────────────────────────────────────────────────

mentorshipRouter.get('/plans', (_req, res) => {
  res.json(Object.values(PLANS).map(p => ({
    id:            p.id,
    name:          p.name,
    price:         p.price,
    label:         p.label,
    badge:         p.badge,
    interval:      p.interval,
    intervalCount: p.intervalCount,
  })));
});

// ── GET /api/mentorship/subscription ─────────────────────────────────────────

mentorshipRouter.get('/subscription', authenticate, async (req: AuthRequest, res: Response) => {
  const sub = await prisma.mentorshipSubscription.findUnique({
    where: { userId: req.userId! },
  });
  if (!sub) return res.json(null);
  res.json({
    plan:             sub.plan,
    status:           sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  });
});

// ── POST /api/mentorship/checkout ─────────────────────────────────────────────

mentorshipRouter.post('/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  const { planId } = req.body;
  const plan = PLANS[planId as keyof typeof PLANS];
  if (!plan) return res.status(400).json({ error: 'Invalid plan' });

  // Block if already subscribed
  const existing = await prisma.mentorshipSubscription.findUnique({
    where: { userId: req.userId! },
  });
  if (existing?.status === 'active') {
    return res.status(409).json({ error: 'Already subscribed' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Get or create Stripe customer
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email:    user.email,
      name:     `${user.firstName} ${user.lastName}`,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
  }

  // Resolve the Stripe Price ID — must be created in Stripe dashboard first
  const priceId = process.env[plan.stripePriceEnvKey];
  if (!priceId) {
    logger.error(`Missing env var: ${plan.stripePriceEnvKey}`);
    return res.status(500).json({ error: 'Payment plan not configured' });
  }

  const webUrl = process.env.WEB_URL ?? 'http://localhost:3001';

  const session = await stripe.checkout.sessions.create({
    customer:   stripeCustomerId,
    mode:       'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${webUrl}/mentorship/dashboard?success=1`,
    cancel_url:  `${webUrl}/mentorship?canceled=1`,
    subscription_data: {
      metadata: { userId: user.id, plan: planId },
    },
  });

  res.json({ url: session.url });
});

// ── POST /api/mentorship/portal ───────────────────────────────────────────────

mentorshipRouter.post('/portal', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.stripeCustomerId) {
    return res.status(400).json({ error: 'No billing account found' });
  }
  const webUrl = process.env.WEB_URL ?? 'http://localhost:3001';
  const portal = await stripe.billingPortal.sessions.create({
    customer:   user.stripeCustomerId,
    return_url: `${webUrl}/mentorship/dashboard`,
  });
  res.json({ url: portal.url });
});

// ── GET /api/mentorship/videos ────────────────────────────────────────────────

mentorshipRouter.get('/videos', authenticate, async (req: AuthRequest, res: Response) => {
  if (!await requireMembership(req, res)) return;
  const videos = await prisma.mentorshipVideo.findMany({
    where:   { published: true },
    orderBy: { publishedAt: 'desc' },
  });
  res.json(videos);
});

// ── GET /api/mentorship/calls ─────────────────────────────────────────────────

mentorshipRouter.get('/calls', authenticate, async (req: AuthRequest, res: Response) => {
  if (!await requireMembership(req, res)) return;
  const calls = await prisma.mentorshipCall.findMany({
    orderBy: { scheduledAt: 'desc' },
  });
  res.json(calls);
});

// ── POST /api/mentorship/calls (admin) ────────────────────────────────────────

mentorshipRouter.post('/calls', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.isPro) return res.status(403).json({ error: 'Admin only' });

  const { title, description, scheduledAt, meetUrl, duration } = req.body;
  if (!title || !scheduledAt) return res.status(400).json({ error: 'title and scheduledAt required' });

  const call = await prisma.mentorshipCall.create({
    data: { title, description, scheduledAt: new Date(scheduledAt), meetUrl, duration: duration ?? 60 },
  });
  res.status(201).json(call);
});

// ── PUT /api/mentorship/calls/:id (admin) ─────────────────────────────────────

mentorshipRouter.put('/calls/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.isPro) return res.status(403).json({ error: 'Admin only' });

  const { title, description, scheduledAt, meetUrl, recordingUrl, isCompleted } = req.body;
  const call = await prisma.mentorshipCall.update({
    where: { id: req.params.id },
    data: {
      ...(title        !== undefined && { title }),
      ...(description  !== undefined && { description }),
      ...(scheduledAt  !== undefined && { scheduledAt: new Date(scheduledAt) }),
      ...(meetUrl      !== undefined && { meetUrl }),
      ...(recordingUrl !== undefined && { recordingUrl }),
      ...(isCompleted  !== undefined && { isCompleted }),
    },
  });
  res.json(call);
});

// ── POST /api/mentorship/videos (admin) ───────────────────────────────────────

mentorshipRouter.post('/videos', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.isPro) return res.status(403).json({ error: 'Admin only' });

  const { title, description, videoUrl, thumbnail, duration, publishedAt } = req.body;
  if (!title || !videoUrl) return res.status(400).json({ error: 'title and videoUrl required' });

  const video = await prisma.mentorshipVideo.create({
    data: {
      title, description, videoUrl, thumbnail,
      duration: duration ?? 0,
      published: true,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    },
  });
  res.status(201).json(video);
});

// ── PUT /api/mentorship/videos/:id (admin) ────────────────────────────────────

mentorshipRouter.put('/videos/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.isPro) return res.status(403).json({ error: 'Admin only' });

  const { title, description, videoUrl, thumbnail, duration, published } = req.body;
  const video = await prisma.mentorshipVideo.update({
    where: { id: req.params.id },
    data: {
      ...(title       !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(videoUrl    !== undefined && { videoUrl }),
      ...(thumbnail   !== undefined && { thumbnail }),
      ...(duration    !== undefined && { duration }),
      ...(published   !== undefined && { published }),
    },
  });
  res.json(video);
});

// ── DELETE /api/mentorship/videos/:id (admin) ─────────────────────────────────

mentorshipRouter.delete('/videos/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.isPro) return res.status(403).json({ error: 'Admin only' });

  await prisma.mentorshipVideo.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ── DELETE /api/mentorship/calls/:id (admin) ──────────────────────────────────

mentorshipRouter.delete('/calls/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.isPro) return res.status(403).json({ error: 'Admin only' });

  await prisma.mentorshipCall.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ── GET /api/mentorship/admin/members (admin) ─────────────────────────────────

mentorshipRouter.get('/admin/members', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.isPro) return res.status(403).json({ error: 'Admin only' });

  const subs = await prisma.mentorshipSubscription.findMany({
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(subs);
});

// ── GET /api/mentorship/admin/videos (admin — includes unpublished) ───────────

mentorshipRouter.get('/admin/videos', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.isPro) return res.status(403).json({ error: 'Admin only' });

  const videos = await prisma.mentorshipVideo.findMany({ orderBy: { publishedAt: 'desc' } });
  res.json(videos);
});

// ── GET /api/mentorship/admin/calls (admin — all calls) ───────────────────────

mentorshipRouter.get('/admin/calls', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.isPro) return res.status(403).json({ error: 'Admin only' });

  const calls = await prisma.mentorshipCall.findMany({ orderBy: { scheduledAt: 'desc' } });
  res.json(calls);
});

export default mentorshipRouter;
