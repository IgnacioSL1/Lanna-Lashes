'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { CourseAPI, Course } from '@/services/api';
import styles from './profile.module.css';

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, refreshUser } = useAuthStore();
  const [tab, setTab] = useState<'courses' | 'orders'>('courses');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth?redirect=/profile'); return; }
    refreshUser().catch(() => {});
    CourseAPI.myEnrollments()
      .then(async (enrs) => {
        setEnrollments(enrs);
        const details = await Promise.all(
          enrs.map((e: any) => CourseAPI.get(e.courseSlug ?? e.courseId).catch(() => null))
        );
        const map: Record<string, Course> = {};
        details.forEach((c, i) => { if (c) map[enrs[i].courseId] = c; });
        setCourses(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router, refreshUser]);

  if (!user) return null;

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div className={styles.page}>
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.avatar}>
          {user.avatar ? (
            <Image src={user.avatar} alt={user.firstName} fill style={{ objectFit: 'cover' }} />
          ) : (
            <span className={styles.initials}>{initials}</span>
          )}
          {user.isPro && <span className={styles.proBadge}>PRO</span>}
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{user.firstName} {user.lastName}</h1>
          <p className={styles.email}>{user.email}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.signOutBtn} onClick={() => { signOut(); router.push('/'); }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'courses' ? styles.tabActive : ''}`} onClick={() => setTab('courses')}>
          My Courses
        </button>
        <button className={`${styles.tab} ${tab === 'orders' ? styles.tabActive : ''}`} onClick={() => setTab('orders')}>
          Orders
        </button>
      </div>

      {/* ── My Courses ────────────────────────────────────────────────────────── */}
      {tab === 'courses' && (
        <div className={styles.section}>
          {loading ? (
            <div className={styles.grid}>
              {[1, 2, 3].map(i => <div key={i} className={`skeleton ${styles.cardSkel}`} />)}
            </div>
          ) : enrollments.length === 0 ? (
            <div className={styles.empty}>
              <p>You haven't enrolled in any courses yet.</p>
              <Link href="/academy" className={styles.emptyBtn}>Browse Courses</Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {enrollments.map((enr) => {
                const course = courses[enr.courseId];
                return (
                  <div key={enr.id} className={styles.courseCard}>
                    {course?.thumbnail ? (
                      <div className={styles.courseThumb}>
                        <Image src={course.thumbnail} alt={course.title} fill style={{ objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div className={`${styles.courseThumb} skeleton`} />
                    )}
                    <div className={styles.courseInfo}>
                      <p className={styles.courseTitle}>{course?.title ?? 'Loading…'}</p>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${enr.progressPercent ?? 0}%` }} />
                      </div>
                      <p className={styles.progressLabel}>{enr.progressPercent ?? 0}% complete</p>
                      {course && (
                        <Link href={`/academy/${course.slug}/learn`} className={styles.resumeBtn}>
                          {enr.progressPercent > 0 ? 'Continue →' : 'Start →'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Orders ────────────────────────────────────────────────────────────── */}
      {tab === 'orders' && (
        <div className={styles.section}>
          <div className={styles.empty}>
            <p>Order history is synced from your Shopify account.</p>
            <a
              href="https://lannalashes.com/account"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.emptyBtn}
            >
              View on lannalashes.com →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
