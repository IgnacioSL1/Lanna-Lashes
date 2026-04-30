'use client';
import styles from '../mentorship/page.module.css';

export default function AdminCommunity() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Community</h1>
          <p className={styles.pageSub}>Post moderation coming soon</p>
        </div>
      </div>
      <div className={styles.tabBody}>
        <div className={styles.empty}>Community moderation panel — coming next.</div>
      </div>
    </div>
  );
}
