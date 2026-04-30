/**
 * Site settings routes
 * GET /api/site/settings  — public: returns current site content
 * PUT /api/site/settings  — admin only: update site content
 */
import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../services/db';

export const siteRouter = Router();
const SETTINGS_PATH = path.join(__dirname, '../../site-settings.json');

const DEFAULT_SETTINGS = {
  hero: {
    title:      'The Art of Perfect Lashes',
    subtitle:   'Premium supplies, professional courses, and a community that lifts each other up.',
    imageUrl:   '',
    videoUrl:   '',
    ctaPrimary: { text: 'Shop Now',       href: '/shop' },
    ctaSecondary: { text: 'Our Courses',  href: '/academy' },
  },
  announcement: '',
  featuredCollection: 'all-lash-products',
};

function readSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); }
  catch { return DEFAULT_SETTINGS; }
}

siteRouter.get('/settings', (_req, res) => {
  res.json(readSettings());
});

siteRouter.put('/settings', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.isPro) return res.status(403).json({ error: 'Admin only' });
  const updated = { ...readSettings(), ...req.body };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2));
  res.json(updated);
});

export default siteRouter;
