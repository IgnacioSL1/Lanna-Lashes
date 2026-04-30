/**
 * Course routes
 * GET  /api/courses
 * GET  /api/courses/:slug
 */
import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { optionalAuth, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/courses ──────────────────────────────────────────────────────────

router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { level, category } = req.query as Record<string, string>;

  const courses = await prisma.course.findMany({
    where: {
      published: true,
      ...(level    ? { level: level as any }       : {}),
      ...(category ? { category }                  : {}),
    },
    include: {
      modules: {
        orderBy: { position: 'asc' },
        include: { lessons: { orderBy: { position: 'asc' } } },
      },
    },
    orderBy: { enrolledCount: 'desc' },
  });

  // Attach user's lesson completion if authenticated
  let completedLessonIds = new Set<string>();
  if (req.userId) {
    const progress = await prisma.lessonProgress.findMany({
      where: { userId: req.userId, completedAt: { not: null } },
      select: { lessonId: true },
    });
    completedLessonIds = new Set(progress.map(p => p.lessonId));
  }

  const formatted = courses.map(c => formatCourse(c, completedLessonIds));
  res.json(formatted);
});

// ── GET /api/courses/:slug ────────────────────────────────────────────────────

router.get('/:slug', optionalAuth, async (req: AuthRequest, res: Response) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug, published: true },
    include: {
      modules: {
        orderBy: { position: 'asc' },
        include: { lessons: { orderBy: { position: 'asc' } } },
      },
    },
  });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  let completedLessonIds = new Set<string>();
  if (req.userId) {
    const progress = await prisma.lessonProgress.findMany({
      where: { userId: req.userId, completedAt: { not: null } },
      select: { lessonId: true },
    });
    completedLessonIds = new Set(progress.map(p => p.lessonId));
  }

  res.json(formatCourse(course, completedLessonIds));
});

function formatCourse(course: any, completedLessonIds: Set<string>) {
  return {
    ...course,
    price: course.price / 100,
    compareAtPrice: course.compareAtPrice ? course.compareAtPrice / 100 : null,
    instructor: {
      name:   course.instructorName,
      avatar: course.instructorAvatar,
      bio:    course.instructorBio,
    },
    modules: course.modules.map((mod: any) => ({
      ...mod,
      lessons: mod.lessons.map((lesson: any) => ({
        ...lesson,
        isCompleted: completedLessonIds.has(lesson.id),
      })),
    })),
  };
}

export default router;
