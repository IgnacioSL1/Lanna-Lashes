'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CourseAPI, Course } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import styles from './course.module.css';

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ''}`.trim();
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [openModule, setOpenModule] = useState<string | null>(null);

  useEffect(() => {
    CourseAPI.get(params.slug)
      .then(c => {
        setCourse(c);
        setOpenModule(c.modules[0]?.id ?? null);
      })
      .catch(() => router.push('/academy'))
      .finally(() => setLoading(false));
  }, [params.slug, router]);

  useEffect(() => {
    if (!user || !course) return;
    CourseAPI.myEnrollments()
      .then(enrollments => setEnrolled(enrollments.some((e: any) => e.courseId === course.id)))
      .catch(() => {});
  }, [user, course]);

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.heroSkel}>
        <div className={`skeleton`} style={{ height: 36, width: '50%', marginBottom: 16 }} />
        <div className={`skeleton`} style={{ height: 20, width: '80%', marginBottom: 24 }} />
        <div className={`skeleton`} style={{ height: 48, width: 160 }} />
      </div>
    </div>
  );

  if (!course) return null;

  const levelLabel = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }[course.level];

  return (
    <div className={styles.page}>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.meta}>
            <span className={styles.level}>{levelLabel}</span>
            <span className={styles.dot}>·</span>
            <span>{course.totalLessons} lessons</span>
            <span className={styles.dot}>·</span>
            <span>{formatDuration(course.totalDurationMinutes)}</span>
            <span className={styles.dot}>·</span>
            <span>★ {course.rating.toFixed(1)} ({course.ratingCount})</span>
          </div>
          <h1 className={styles.title}>{course.title}</h1>
          <p className={styles.subtitle}>{course.shortDescription}</p>
          <div className={styles.instructor}>
            {course.instructor.avatar && (
              <Image
                src={course.instructor.avatar}
                alt={course.instructor.name}
                width={36}
                height={36}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <span>by <strong>{course.instructor.name}</strong></span>
          </div>
          <div className={styles.heroCta}>
            <span className={styles.heroPrice}>{formatPrice(course.price)}</span>
            {enrolled ? (
              <Link href={`/academy/${params.slug}/learn`} className={styles.ctaBtn}>
                Continue Learning →
              </Link>
            ) : (
              <Link
                href={user ? `/academy/${params.slug}/checkout` : '/auth'}
                className={styles.ctaBtn}
              >
                Enroll Now
              </Link>
            )}
          </div>
        </div>
        {course.thumbnail && (
          <div className={styles.heroThumb}>
            <Image src={course.thumbnail} alt={course.title} fill style={{ objectFit: 'cover' }} />
            {course.previewVideoUrl && (
              <div className={styles.playOverlay}>
                <span className={styles.playBtn}>▶</span>
                <span>Preview</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.body}>
        {/* ── Curriculum ─────────────────────────────────────────────────────── */}
        <div className={styles.main}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Course Curriculum</h2>
            <div className={styles.modules}>
              {course.modules.map(mod => (
                <div key={mod.id} className={styles.module}>
                  <button
                    className={styles.moduleHeader}
                    onClick={() => setOpenModule(openModule === mod.id ? null : mod.id)}
                  >
                    <span>{mod.title}</span>
                    <span className={`${styles.chevron} ${openModule === mod.id ? styles.chevronOpen : ''}`}>›</span>
                  </button>
                  {openModule === mod.id && (
                    <div className={styles.lessons}>
                      {mod.lessons.map(lesson => (
                        <div key={lesson.id} className={styles.lesson}>
                          <span className={styles.lessonIcon}>
                            {lesson.isCompleted ? '✓' : lesson.isPreview ? '▶' : '○'}
                          </span>
                          <span className={styles.lessonTitle}>{lesson.title}</span>
                          <span className={styles.lessonDur}>{lesson.durationMinutes}m</span>
                          {lesson.isPreview && <span className={styles.previewBadge}>Preview</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>About this course</h2>
            <p className={styles.description}>{course.description}</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Instructor</h2>
            <div className={styles.instructorCard}>
              {course.instructor.avatar && (
                <Image
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  width={64}
                  height={64}
                  style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <div>
                <p className={styles.instructorName}>{course.instructor.name}</p>
                <p className={styles.instructorBio}>{course.instructor.bio}</p>
              </div>
            </div>
          </section>
        </div>

        {/* ── Sticky sidebar CTA ─────────────────────────────────────────────── */}
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            {course.thumbnail && (
              <div className={styles.sideThumb}>
                <Image src={course.thumbnail} alt={course.title} fill style={{ objectFit: 'cover' }} />
              </div>
            )}
            <div className={styles.sideBody}>
              <p className={styles.sidePrice}>{formatPrice(course.price)}</p>
              {course.compareAtPrice && (
                <p className={styles.sideCompare}>{formatPrice(course.compareAtPrice)}</p>
              )}
              {enrolled ? (
                <Link href={`/academy/${params.slug}/learn`} className={styles.sideBtn}>Continue Learning →</Link>
              ) : (
                <Link href={user ? `/academy/${params.slug}/checkout` : '/auth'} className={styles.sideBtn}>
                  Enroll Now
                </Link>
              )}
              <ul className={styles.perks}>
                <li>✓ {course.totalLessons} lessons · {formatDuration(course.totalDurationMinutes)}</li>
                <li>✓ Lifetime access</li>
                <li>✓ Certificate on completion</li>
                <li>✓ {course.enrolledCount.toLocaleString()} students enrolled</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
