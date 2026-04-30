'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CourseAPI, Course } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import styles from './learn.module.css';

export default function CourseLearnPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<{ id: string; title: string; videoUrl?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
    CourseAPI.get(params.slug)
      .then(c => {
        setCourse(c);
        const firstLesson = c.modules[0]?.lessons[0];
        if (firstLesson) setActiveLesson(firstLesson);
      })
      .catch(() => router.push('/academy'))
      .finally(() => setLoading(false));
  }, [params.slug, router, user]);

  if (loading) return (
    <div className={styles.page}>
      <div className={`skeleton ${styles.videoSkel}`} />
    </div>
  );

  if (!course) return null;

  const allLessons = course.modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title })));
  const currentIdx = allLessons.findIndex(l => l.id === activeLesson?.id);
  const nextLesson = allLessons[currentIdx + 1] ?? null;
  const prevLesson = allLessons[currentIdx - 1] ?? null;

  return (
    <div className={styles.page}>
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => router.push(`/academy/${params.slug}`)}>
          ← {course.title}
        </button>
        <div className={styles.topbarCenter}>
          {activeLesson && <span className={styles.lessonName}>{activeLesson.title}</span>}
        </div>
        <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(o => !o)}>
          {sidebarOpen ? '✕ Hide' : '≡ Contents'}
        </button>
      </header>

      <div className={styles.layout}>
        {/* ── Video area ───────────────────────────────────────────────────────── */}
        <div className={styles.videoArea}>
          <div className={styles.videoWrapper}>
            {activeLesson?.videoUrl ? (
              <iframe
                ref={iframeRef}
                src={activeLesson.videoUrl}
                className={styles.videoFrame}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={activeLesson.title}
              />
            ) : (
              <div className={styles.videoPlaceholder}>
                <p>Video not available yet</p>
              </div>
            )}
          </div>

          {/* Nav controls */}
          <div className={styles.controls}>
            <button
              className={styles.navBtn}
              onClick={() => prevLesson && setActiveLesson(prevLesson)}
              disabled={!prevLesson}
            >
              ← Previous
            </button>
            <span className={styles.progress}>
              {currentIdx + 1} / {allLessons.length}
            </span>
            <button
              className={`${styles.navBtn} ${styles.navBtnNext}`}
              onClick={() => nextLesson && setActiveLesson(nextLesson)}
              disabled={!nextLesson}
            >
              Next →
            </button>
          </div>
        </div>

        {/* ── Curriculum sidebar ────────────────────────────────────────────────── */}
        {sidebarOpen && (
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Course Contents</h3>
            {course.modules.map(mod => (
              <div key={mod.id} className={styles.module}>
                <p className={styles.moduleTitle}>{mod.title}</p>
                {mod.lessons.map(lesson => (
                  <button
                    key={lesson.id}
                    className={`${styles.lessonBtn} ${lesson.id === activeLesson?.id ? styles.lessonActive : ''} ${lesson.isCompleted ? styles.lessonDone : ''}`}
                    onClick={() => setActiveLesson(lesson)}
                  >
                    <span className={styles.lessonIcon}>
                      {lesson.isCompleted ? '✓' : '○'}
                    </span>
                    <span className={styles.lessonLabel}>{lesson.title}</span>
                    <span className={styles.lessonDur}>{lesson.durationMinutes}m</span>
                  </button>
                ))}
              </div>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
