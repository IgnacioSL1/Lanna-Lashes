/**
 * Lanna Lashes API — main entry point
 */
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './services/logger';

// Routes
import authRoutes        from './routes/auth';
import courseRoutes      from './routes/courses';
import enrollmentRoutes  from './routes/enrollments';
import progressRoutes    from './routes/progress';
import communityRoutes   from './routes/community';
import paymentRoutes     from './routes/payments';
import shopifyRoutes     from './routes/shopify';
import uploadRoutes      from './routes/uploads';
import webhookRoutes     from './routes/webhooks';
import mentorshipRoutes  from './routes/mentorship';
import siteRoutes        from './routes/site';

dotenv.config();

const app  = express();
const PORT = process.env.PORT ?? 3000;

// ─── Security middleware ──────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: [
    'https://lannalashes.com',
    'https://www.lannalashes.com',
    /^exp:\/\//,       // Expo Go
    /^http:\/\/localhost/,
  ],
  credentials: true,
}));

// Stripe webhooks need raw body — must be before express.json()
app.use('/webhooks', webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (disabled in development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 10000,
  message: { error: 'Too many auth attempts. Please wait.' },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth',        authLimiter, authRoutes);
app.use('/api/courses',     courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress',    progressRoutes);
app.use('/api/community',   communityRoutes);
app.use('/api/payments',    paymentRoutes);
app.use('/api/shopify',     shopifyRoutes);
app.use('/api/uploads',     uploadRoutes);
app.use('/api/mentorship',  mentorshipRoutes);
app.use('/api/site',        siteRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, url: req.url, method: req.method });
  const status  = err.status ?? err.statusCode ?? 500;
  const message = err.expose || status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  logger.info(`Lanna Lashes API running on port ${PORT}`);
});

export default app;
