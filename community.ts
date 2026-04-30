/**
 * Community routes
 * GET  /api/community/posts
 * POST /api/community/posts
 * POST /api/community/posts/:id/like
 * GET  /api/community/posts/:id/comments
 * POST /api/community/posts/:id/comments
 * GET  /api/community/stats
 */
import { Router, Response } from 'express';
import { prisma } from '../services/db';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const PAGE_SIZE = 20;

router.get('/stats', async (_req, res) => {
  const [memberCount, postsToday] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({
      where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
    }),
  ]);
  res.json({ memberCount, postsToday, liveNow: 0 });
});

router.get('/posts', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { tag, cursor } = req.query as Record<string, string>;
  const posts = await prisma.post.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: tag ? { tag: tag as any } : {},
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  });

  const hasMore = posts.length > PAGE_SIZE;
  const page    = hasMore ? posts.slice(0, PAGE_SIZE) : posts;

  // Attach isLiked for authenticated user
  let likedIds = new Set<string>();
  if (req.userId) {
    const likes = await prisma.postLike.findMany({
      where: { userId: req.userId, postId: { in: page.map(p => p.id) } },
      select: { postId: true },
    });
    likedIds = new Set(likes.map(l => l.postId));
  }

  res.json({
    posts: page.map(p => ({ ...p, isLiked: likedIds.has(p.id) })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});

router.post('/posts', authenticate, async (req: AuthRequest, res: Response) => {
  const { content, tag, images = [] } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });
  const post = await prisma.post.create({
    data: { authorId: req.userId!, content, tag, images },
    include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  });
  res.status(201).json({ ...post, isLiked: false });
});

router.post('/posts/:id/like', authenticate, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId: req.userId!, postId: req.params.id } },
  });
  if (existing) {
    await prisma.$transaction([
      prisma.postLike.delete({ where: { userId_postId: { userId: req.userId!, postId: req.params.id } } }),
      prisma.post.update({ where: { id: req.params.id }, data: { likeCount: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.postLike.create({ data: { userId: req.userId!, postId: req.params.id } }),
      prisma.post.update({ where: { id: req.params.id }, data: { likeCount: { increment: 1 } } }),
    ]);
  }
  res.json({ liked: !existing });
});

router.get('/posts/:id/comments', optionalAuth, async (req: AuthRequest, res: Response) => {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  });

  let likedIds = new Set<string>();
  if (req.userId) {
    const likes = await prisma.commentLike.findMany({
      where: { userId: req.userId, commentId: { in: comments.map(c => c.id) } },
      select: { commentId: true },
    });
    likedIds = new Set(likes.map(l => l.commentId));
  }

  res.json(comments.map(c => ({ ...c, isLiked: likedIds.has(c.id) })));
});

router.post('/posts/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { postId: req.params.id, authorId: req.userId!, content },
      include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    }),
    prisma.post.update({ where: { id: req.params.id }, data: { commentCount: { increment: 1 } } }),
  ]);
  res.status(201).json({ ...comment, isLiked: false });
});

export default router;
