/**
 * Database seed — run with: npm run db:seed
 * Creates sample courses with modules and lessons for development.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database…');

  // ── Demo user ────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@lannalashes.com' },
    update: {},
    create: {
      email: 'demo@lannalashes.com',
      passwordHash,
      firstName: 'Lanna',
      lastName: 'Demo',
      isPro: true,
    },
  });
  console.log(`  ✓ User: ${user.email}`);

  // ── Courses ──────────────────────────────────────────────────────────────────
  const courseData = [
    {
      title: 'Classic Lash Fundamentals',
      slug: 'classic-lash-fundamentals',
      shortDescription: 'Master the essential techniques every lash artist needs to know.',
      description: 'A comprehensive introduction to classic lash extensions. Learn proper isolation, mapping, and application technique from the ground up. This course covers everything from client consultation and eye assessment to choosing the right curl, length, and thickness for each client.',
      price: 19900,
      compareAtPrice: 29900,
      level: 'beginner' as const,
      category: 'classic',
      instructorName: 'Lanna',
      instructorBio: 'Master lash artist with 10+ years of experience and creator of the Lanna Lashes method.',
      tags: ['classic', 'beginner', 'fundamentals'],
      totalDurationMinutes: 240,
      enrolledCount: 1284,
      rating: 4.9,
      ratingCount: 312,
      modules: [
        {
          title: 'Getting Started',
          lessons: [
            { title: 'Welcome & What You\'ll Learn', durationMinutes: 5, isPreview: true },
            { title: 'Your Workstation Setup', durationMinutes: 12 },
            { title: 'Tools & Products Overview', durationMinutes: 18, isPreview: true },
          ],
        },
        {
          title: 'Client Consultation',
          lessons: [
            { title: 'Eye Shape Assessment', durationMinutes: 20 },
            { title: 'Lash Mapping Basics', durationMinutes: 25 },
            { title: 'Choosing Length & Curl', durationMinutes: 15 },
          ],
        },
        {
          title: 'Application Technique',
          lessons: [
            { title: 'Isolation Masterclass', durationMinutes: 35 },
            { title: 'Perfect Adhesive Placement', durationMinutes: 30 },
            { title: 'Working Speed & Efficiency', durationMinutes: 25 },
            { title: 'Finishing & Aftercare', durationMinutes: 20 },
          ],
        },
        {
          title: 'Your First Full Set',
          lessons: [
            { title: 'Live Demo: Full Classic Set', durationMinutes: 55 },
            { title: 'Common Mistakes & How to Fix Them', durationMinutes: 20 },
          ],
        },
      ],
    },
    {
      title: 'Volume Lash Mastery',
      slug: 'volume-lash-mastery',
      shortDescription: 'Create stunning Russian and mega volume fans from scratch.',
      description: 'Take your lash skills to the next level with volume lashing. This intermediate course covers hand-made fan creation, fan sizing, symmetry, and the technical precision needed to deliver dramatic, long-lasting volume sets that clients love.',
      price: 29900,
      compareAtPrice: null,
      level: 'intermediate' as const,
      category: 'volume',
      instructorName: 'Lanna',
      instructorBio: 'Master lash artist with 10+ years of experience and creator of the Lanna Lashes method.',
      tags: ['volume', 'russian', 'intermediate'],
      totalDurationMinutes: 320,
      enrolledCount: 876,
      rating: 4.8,
      ratingCount: 198,
      modules: [
        {
          title: 'Volume Foundations',
          lessons: [
            { title: 'What Makes a Perfect Fan', durationMinutes: 10, isPreview: true },
            { title: 'Lash Tape & Tray Setup', durationMinutes: 8 },
          ],
        },
        {
          title: 'Hand-Made Fans',
          lessons: [
            { title: '2D & 3D Fans', durationMinutes: 40 },
            { title: '4D–6D Russian Volume', durationMinutes: 50 },
            { title: 'Mega Volume 10D+', durationMinutes: 45 },
          ],
        },
        {
          title: 'Application & Mapping',
          lessons: [
            { title: 'Volume Lash Map Design', durationMinutes: 30 },
            { title: 'Application Technique', durationMinutes: 50 },
            { title: 'Retention & Longevity', durationMinutes: 25 },
          ],
        },
        {
          title: 'Live Full Set',
          lessons: [
            { title: 'Live Demo: Russian Volume Set', durationMinutes: 60 },
            { title: 'Q&A and Common Issues', durationMinutes: 22 },
          ],
        },
      ],
    },
    {
      title: 'Lash Business Accelerator',
      slug: 'lash-business-accelerator',
      shortDescription: 'Build a fully booked, profitable lash business from scratch.',
      description: 'The complete business course for lash artists ready to scale. Covers pricing strategy, client retention, social media marketing, booking systems, hiring your first employee, and building a brand that attracts premium clients.',
      price: 49900,
      compareAtPrice: null,
      level: 'advanced' as const,
      category: 'business',
      instructorName: 'Lanna',
      instructorBio: 'Master lash artist with 10+ years of experience and creator of the Lanna Lashes method.',
      tags: ['business', 'advanced', 'marketing'],
      totalDurationMinutes: 280,
      enrolledCount: 432,
      rating: 5.0,
      ratingCount: 87,
      modules: [
        {
          title: 'Pricing & Packages',
          lessons: [
            { title: 'How to Price Your Services', durationMinutes: 30, isPreview: true },
            { title: 'Creating Service Packages', durationMinutes: 25 },
            { title: 'Raising Your Prices Without Losing Clients', durationMinutes: 20 },
          ],
        },
        {
          title: 'Marketing & Social Media',
          lessons: [
            { title: 'Building Your Instagram', durationMinutes: 35 },
            { title: 'Content That Converts', durationMinutes: 40 },
            { title: 'Client Referral Systems', durationMinutes: 20 },
          ],
        },
        {
          title: 'Operations & Growth',
          lessons: [
            { title: 'Booking Systems & Automation', durationMinutes: 25 },
            { title: 'Client Retention Strategies', durationMinutes: 30 },
            { title: 'Hiring Your First Employee', durationMinutes: 35 },
            { title: 'Scaling to a Salon', durationMinutes: 40 },
          ],
        },
      ],
    },
  ];

  for (const course of courseData) {
    const { modules, ...courseFields } = course;

    const created = await prisma.course.upsert({
      where: { slug: courseFields.slug },
      update: {},
      create: {
        ...courseFields,
        published: true,
        totalLessons: modules.reduce((sum, m) => sum + m.lessons.length, 0),
        instructorAvatar: null,
        thumbnail: null,
        previewVideoUrl: null,
      },
    });

    for (let mi = 0; mi < modules.length; mi++) {
      const mod = modules[mi];
      const createdMod = await prisma.module.create({
        data: { courseId: created.id, title: mod.title, position: mi + 1 },
      });

      for (let li = 0; li < mod.lessons.length; li++) {
        const lesson = mod.lessons[li];
        await prisma.lesson.create({
          data: {
            moduleId: createdMod.id,
            title: lesson.title,
            position: li + 1,
            durationMinutes: lesson.durationMinutes,
            isPreview: (lesson as any).isPreview ?? false,
            videoUrl: null,
          },
        });
      }
    }

    console.log(`  ✓ Course: ${created.title}`);
  }

  // ── Sample community posts ────────────────────────────────────────────────────
  const posts = [
    { content: 'Just completed my first full classic set and I\'m so proud! The isolation technique from the fundamentals course made such a difference. 🖤', tag: 'my_work' as const },
    { content: 'Quick tip: always do a patch test 48 hours before the appointment. Saved me from a disaster last week with a new client who turned out to have a latex sensitivity.', tag: 'tip' as const },
    { content: 'Anyone else struggling with retention in humid climates? My sets are barely lasting 2 weeks. Would love some advice!', tag: 'question' as const },
    { content: 'Inspo dump from this week\'s sets. Loving the natural wispy look right now — clients are obsessed.', tag: 'inspo' as const },
  ];

  for (const post of posts) {
    await prisma.post.create({
      data: { authorId: user.id, content: post.content, tag: post.tag, images: [] },
    });
  }
  console.log(`  ✓ ${posts.length} community posts`);

  console.log('\nSeed complete! 🎉');
  console.log('  Demo login: demo@lannalashes.com / password123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
