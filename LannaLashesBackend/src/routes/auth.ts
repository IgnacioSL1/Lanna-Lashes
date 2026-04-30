/**
 * Auth routes
 * POST /api/auth/signup
 * POST /api/auth/signin
 * GET  /api/auth/me
 * PUT  /api/auth/profile
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../services/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { hubspot } from '../services/hubspot';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function safeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────

const SignupSchema = z.object({
  email:     z.string().email(),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
});

router.post('/signup', async (req: Request, res: Response) => {
  const body = SignupSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      email:     body.email.toLowerCase(),
      passwordHash,
      firstName: body.firstName,
      lastName:  body.lastName,
    },
  });

  // Sync to HubSpot CRM (non-blocking)
  hubspot.createContact(user).catch(() => {});

  const token = signToken(user.id);
  res.status(201).json({ user: safeUser(user), token });
});

// ── POST /api/auth/signin ─────────────────────────────────────────────────────

const SigninSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

router.post('/signin', async (req: Request, res: Response) => {
  const body = SigninSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = signToken(user.id);
  res.json({ user: safeUser(user), token });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
});

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────

const ProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName:  z.string().min(1).optional(),
  avatar:    z.string().url().nullable().optional(),
});

router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  const body = ProfileSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: body,
  });
  res.json(safeUser(user));
});

export default router;
