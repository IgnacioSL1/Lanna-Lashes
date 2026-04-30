'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import styles from './Nav.module.css';

const LINKS = [
  { href: '/shop',      label: 'Shop' },
  { href: '/academy',   label: 'Academy' },
  { href: '/community', label: 'Community' },
];

export function Nav() {
  const pathname     = usePathname();
  const totalItems   = useCartStore(s => s.totalItems());
  const { user }     = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>

          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}>LL</span>
            <span className={styles.logoText}>LANNA LASHES</span>
          </Link>

          {/* Desktop links */}
          <div className={styles.links}>
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.link} ${pathname.startsWith(l.href) ? styles.linkActive : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className={styles.actions}>
            <Link href="/search" className={styles.iconBtn} aria-label="Search">
              <SearchIcon />
            </Link>

            <Link href="/cart" className={styles.iconBtn} aria-label="Cart">
              <CartIcon />
              {totalItems > 0 && (
                <span className={styles.cartBadge}>{totalItems}</span>
              )}
            </Link>

            {user ? (
              <Link href="/profile" className={styles.avatarBtn}>
                <span>{user.firstName[0]}{user.lastName[0]}</span>
              </Link>
            ) : (
              <Link href="/auth" className={styles.signInBtn}>Sign in</Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className={styles.menuBtn}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <span className={`${styles.menuBar} ${menuOpen ? styles.menuBarOpen1 : ''}`} />
              <span className={`${styles.menuBar} ${menuOpen ? styles.menuBarOpen2 : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.drawer}>
          <div className={styles.drawerInner}>
            {LINKS.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.drawerLink} animate-fade-up delay-${i + 1}`}
              >
                {l.label}
                <span className={styles.drawerArrow}>→</span>
              </Link>
            ))}
            <div className={styles.drawerDivider} />
            {user ? (
              <Link href="/profile" className={`${styles.drawerLink} animate-fade-up delay-4`}>
                My Account
              </Link>
            ) : (
              <Link href="/auth" className={`${styles.drawerLink} animate-fade-up delay-4`}>
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}
