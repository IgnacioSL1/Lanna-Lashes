'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import styles from './layout.module.css';

const NAV = [
  { href: '/admin/homepage',   label: 'Homepage' },
  { href: '/admin/mentorship', label: 'Blueprint' },
  { href: '/admin/courses',    label: 'Courses' },
  { href: '/admin/community',  label: 'Community' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) { router.push('/auth?redirect=' + pathname); return; }
    if (!user.isPro) { router.push('/'); }
  }, [user, pathname, router]);

  if (!user?.isPro) return null;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <p className={styles.sidebarBrand}>LL Admin</p>
          <p className={styles.sidebarSub}>Content Management</p>
        </div>
        <nav className={styles.sidebarNav}>
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`${styles.sidebarLink} ${pathname.startsWith(n.href) ? styles.sidebarLinkActive : ''}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <p className={styles.sidebarUser}>{user.firstName} {user.lastName}</p>
          <Link href="/" className={styles.sidebarBack}>← Back to site</Link>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
