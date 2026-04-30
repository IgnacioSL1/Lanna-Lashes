'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CourseAPI, Course } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import styles from './academy.module.css';

const FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Business'];

export default function AcademyPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [courses, setCourses]     = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter]       = useState('All');

  useEffect(() => {
    setIsLoading(true);
    const level    = filter === 'All' || filter === 'Business' ? undefined : filter.toLowerCase() as any;
    const category = filter === 'Business' ? 'business' : undefined;
    CourseAPI.list({ level, category })
      .then(setCourses)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [filter]);

  const levelBg = (level: string) =>
    level === 'beginner' ? '#1a1a1a' : level === 'intermediate' ? '#343433' : '#5a5857';

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerBgText}>LL</div>
          <p className={styles.headerLabel}>Lanna Academy</p>
          <h1 className={styles.headerTitle}>Master the Art of Lashes</h1>
          <p className={styles.headerSub}>
            Professional techniques for every level — from your first classic set to running your own salon.
          </p>
          {/* Stats */}
          <div className={styles.statsRow}>
            {[['3,200+', 'Students'], ['15+', 'Courses'], ['4.9★', 'Rating'], ['30-day', 'Guarantee']].map(([n, l]) => (
              <div key={l} className={styles.stat}>
                <span className={styles.statNum}>{n}</span>
                <span className={styles.statLabel}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <div className={styles.filterBarInner}>
          {FILTERS.map(f => (
            <button
              key={f}
              className={`${styles.filterChip} ${filter === f ? styles.filterChipActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={`skeleton ${styles.skeletonThumb}`} />
                <div style={{ padding: 16 }}>
                  <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 12, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {courses.map((course, i) => (
              <div
                key={course.id}
                className={`${styles.courseCard} animate-fade-up`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <Link href={`/academy/${course.slug}`} className={styles.courseThumbLink}>
                  <div className={styles.courseThumb} style={{ background: levelBg(course.level) }}>
                    {course.thumbnail
                      ? <img src={course.thumbnail} alt={course.title} className={styles.courseThumbImg} />
                      : <span className={styles.courseThumbLL}>LL</span>
                    }
                    <span className={styles.courseLevelBadge}>{course.level.toUpperCase()}</span>
                    <div className={styles.coursePlayBtn}>▶</div>
                    <div className={styles.courseMeta}>
                      {course.totalLessons} lessons · {Math.round(course.totalDurationMinutes / 60)}h
                    </div>
                  </div>
                </Link>
                <div className={styles.courseBody}>
                  <span className={styles.courseCategory}>{course.category.toUpperCase()}</span>
                  <Link href={`/academy/${course.slug}`}>
                    <h3 className={styles.courseTitle}>{course.title}</h3>
                  </Link>
                  <p className={styles.courseDesc} >{course.shortDescription}</p>
                  <div className={styles.courseStudents}>
                    {course.enrolledCount.toLocaleString()} students enrolled
                  </div>
                  <div className={styles.courseFooter}>
                    <span className={styles.coursePrice}>${course.price}</span>
                    <Link
                      href={isAuthenticated() ? `/academy/${course.slug}` : '/auth'}
                      className={styles.enrollBtn}
                    >
                      {isAuthenticated() ? 'View Course' : 'Enroll Now'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
