/**
 * Enrollments routes
 * GET  /api/enrollments           — my enrollments
 * GET  /api/enrollments/:courseId — single enrollment
 * POST /api/enrollments           — enroll (after Stripe payment)
 */
import { Router, Response } from 'express';
import { prisma } from '../services/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { hubspot } from '../services/hubspot';

export const enrollmentRouter = Router();

enrollmentRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: req.userId! },
    orderBy: { enrolledAt: 'desc' },
  });
  res.json(enrollments);
});

enrollmentRouter.get('/:courseId', authenticate, async (req: AuthRequest, res: Response) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.userId!, courseId: req.params.courseId } },
  });
  if (!enrollment) return res.status(404).json({ error: 'Not enrolled' });
  res.json(enrollment);
});

// Called by Stripe webhook after payment succeeds — not called directly from app
enrollmentRouter.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { courseId, stripePaymentIntentId } = req.body;

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.userId!, courseId } },
  });
  if (existing) return res.json(existing);

  const [enrollment] = await prisma.$transaction([
    prisma.enrollment.create({
      data: { userId: req.userId!, courseId, stripePaymentIntentId },
    }),
    prisma.course.update({
      where: { id: courseId },
      data: { enrolledCount: { increment: 1 } },
    }),
  ]);

  // Notify HubSpot: course purchased
  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.userId! } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (user && course) {
    hubspot.trackEvent(user, 'course_purchased', { courseTitle: course.title, price: course.price / 100 }).catch(() => {});
  }

  res.status(201).json(enrollment);
});

export default enrollmentRouter;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Progress routes
 * POST /api/progress          — update lesson progress
 * POST /api/progress/complete — mark lesson complete
 */
import { Router as ProgressRouter, Response as ProgressRes } from 'express';
export const progressRouter = ProgressRouter();

progressRouter.post('/', authenticate, async (req: AuthRequest, res: ProgressRes) => {
  const { lessonId, progressSeconds } = req.body;
  const record = await prisma.lessonProgress.upsert({
    where:  { userId_lessonId: { userId: req.userId!, lessonId } },
    update: { progressSeconds, updatedAt: new Date() },
    create: { userId: req.userId!, lessonId, progressSeconds },
  });

  // Recalculate enrollment progress %
  await recalcProgress(req.userId!, lessonId);
  res.json(record);
});

progressRouter.post('/complete', authenticate, async (req: AuthRequest, res: ProgressRes) => {
  const { lessonId } = req.body;
  const record = await prisma.lessonProgress.upsert({
    where:  { userId_lessonId: { userId: req.userId!, lessonId } },
    update: { completedAt: new Date() },
    create: { userId: req.userId!, lessonId, progressSeconds: 0, completedAt: new Date() },
  });

  const pct = await recalcProgress(req.userId!, lessonId);

  // If 100%, mark enrollment complete and trigger HubSpot upsell
  if (pct === 100) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    const courseId = lesson?.module?.course?.id;
    if (courseId) {
      await prisma.enrollment.update({
        where: { userId_courseId: { userId: req.userId!, courseId } },
        data:  { completedAt: new Date(), progressPercent: 100 },
      });
      const user = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (user && lesson?.module?.course) {
        hubspot.trackEvent(user, 'course_completed', {
          courseTitle: lesson.module.course.title,
        }).catch(() => {});
      }
    }
  }

  res.json(record);
});

async function recalcProgress(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: { include: { modules: { include: { lessons: true } } } } } } },
  });
  if (!lesson?.module?.course) return 0;

  const course     = lesson.module.course;
  const allLessons = course.modules.flatMap((m: any) => m.lessons);
  const completed  = await prisma.lessonProgress.count({
    where: { userId, lessonId: { in: allLessons.map((l: any) => l.id) }, completedAt: { not: null } },
  });
  const pct = Math.round((completed / allLessons.length) * 100);
  await prisma.enrollment.updateMany({
    where: { userId, courseId: course.id },
    data:  { progressPercent: pct, lastWatchedLessonId: lessonId },
  });
  return pct;
}

export { progressRouter as default };
