'use client';
import styles from '../mentorship/page.module.css';

export default function AdminCourses() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Courses</h1>
          <p className={styles.pageSub}>Course management coming soon</p>
        </div>
      </div>
      <div className={styles.tabBody}>
        <div className={styles.empty}>Course admin panel — coming next.</div>
      </div>
    </div>
  );
}
