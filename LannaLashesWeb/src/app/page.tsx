'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProducts, formatPrice, ShopifyProduct } from '@/services/shopify';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const DEFAULT_SETTINGS = {
  hero: {
    title:        'The Art of Perfect Lashes',
    subtitle:     'Premium supplies, professional courses, and a community that lifts each other up.',
    imageUrl:     '',
    videoUrl:     '',
    ctaPrimary:   { text: 'Shop Now',    href: '/shop' },
    ctaSecondary: { text: 'Our Courses', href: '/academy' },
  },
  announcement: '',
};

export default function HomePage() {
  const [products, setProducts]   = useState<ShopifyProduct[]>([]);
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    getProducts(4, 'all-lash-products').then(setProducts).catch(() => {});
    fetch(`${API}/api/site/settings`).then(r => r.json()).then(setSettings).catch(() => {});
  }, []);

  const hero = settings.hero;

  return (
    <div className={styles.page}>

      {/* Announcement bar */}
      {settings.announcement && (
        <div className={styles.announcement}>{settings.announcement}</div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className={styles.hero}
        style={hero.imageUrl ? { backgroundImage: `url(${hero.imageUrl})` } : {}}
      >
        {hero.videoUrl && (
          <video
            className={styles.heroVideo}
            src={hero.videoUrl}
            autoPlay muted loop playsInline
          />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={`${styles.heroEyebrow} animate-fade-up`}>Lanna Lashes</p>
          <h1 className={`${styles.heroTitle} animate-fade-up delay-1`}>
            {hero.title}
          </h1>
          <p className={`${styles.heroSub} animate-fade-up delay-2`}>
            {hero.subtitle}
          </p>
          <div className={`${styles.heroCtas} animate-fade-up delay-3`}>
            <Link href={hero.ctaPrimary.href} className={styles.ctaPrimary}>
              {hero.ctaPrimary.text}
            </Link>
            <Link href={hero.ctaSecondary.href} className={styles.ctaSecondary}>
              {hero.ctaSecondary.text}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Three pillars ─────────────────────────────────────────────────── */}
      <section className={styles.pillars}>
        <div className={styles.container}>
          {PILLARS.map((p, i) => (
            <Link key={p.title} href={p.href} className={`${styles.pillar} animate-fade-up delay-${i + 1}`}>
              <span className={styles.pillarIcon}>{p.icon}</span>
              <h3 className={styles.pillarTitle}>{p.title}</h3>
              <p className={styles.pillarDesc}>{p.desc}</p>
              <span className={styles.pillarLink}>{p.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Bestsellers ───────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Top Picks</p>
              <h2 className={styles.sectionTitle}>Bestsellers</h2>
            </div>
            <Link href="/shop" className={styles.sectionLink}>View all →</Link>
          </div>
          <div className={styles.productGrid}>
            {products.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.productCardSkel}>
                    <div className={`skeleton ${styles.productImageSkel}`} />
                    <div className={styles.productInfo}>
                      <div className="skeleton" style={{ height: 10, width: '50%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 12 }} />
                      <div className="skeleton" style={{ height: 14, width: '35%' }} />
                    </div>
                  </div>
                ))
              : products.map((p, i) => {
                  const price   = formatPrice(p.priceRange.minVariantPrice.amount, p.priceRange.minVariantPrice.currencyCode);
                  const imgUrl  = p.images.edges[0]?.node.url;
                  const cmpAt   = parseFloat(p.compareAtPriceRange.minVariantPrice.amount);
                  const minP    = parseFloat(p.priceRange.minVariantPrice.amount);
                  return (
                    <Link
                      key={p.id}
                      href={`/shop/${p.handle}`}
                      className={`${styles.productCard} animate-fade-up delay-${i + 1}`}
                    >
                      <div className={styles.productImage}>
                        {imgUrl
                          ? <img src={imgUrl} alt={p.title} className={styles.productImg} />
                          : <span className={styles.productLL}>LL</span>
                        }
                        {cmpAt > minP && <span className={styles.productBadge}>Sale</span>}
                      </div>
                      <div className={styles.productInfo}>
                        <span className={styles.productCategory}>
                          {p.collections.edges[0]?.node.title ?? 'Lanna Lashes'}
                        </span>
                        <h4 className={styles.productName}>{p.title}</h4>
                        <div className={styles.productPriceRow}>
                          {cmpAt > minP && (
                            <span className={styles.productOldPrice}>
                              {formatPrice(p.compareAtPriceRange.minVariantPrice.amount)}
                            </span>
                          )}
                          <span className={styles.productPrice}>{price}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
            }
          </div>
        </div>
      </section>

      {/* ── Blueprint mentorship banner ────────────────────────────────────── */}
      <section className={styles.blueprintBanner}>
        <div className={styles.blueprintInner}>
          <div className={styles.blueprintContent}>
            <p className={styles.blueprintLabel}>Lanna Lashes Blueprint</p>
            <h2 className={styles.blueprintTitle}>From Overworked to Booked Out</h2>
            <p className={styles.blueprintSub}>
              Monthly live calls, weekly videos, and direct access to Alanna — everything you need to grow a profitable beauty brand.
            </p>
            <div className={styles.blueprintStats}>
              {[['235K+', 'Followers'], ['13,000+', 'Students'], ['$87', '/month']].map(([n, l]) => (
                <div key={l} className={styles.blueprintStat}>
                  <span className={styles.blueprintStatNum}>{n}</span>
                  <span className={styles.blueprintStatLabel}>{l}</span>
                </div>
              ))}
            </div>
            <Link href="/mentorship" className={styles.blueprintCta}>Join the Blueprint →</Link>
          </div>
        </div>
      </section>

      {/* ── Academy banner ────────────────────────────────────────────────── */}
      <section className={styles.section} style={{ background: 'var(--white)' }}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Education</p>
              <h2 className={styles.sectionTitle}>Learn from the Best</h2>
            </div>
            <Link href="/academy" className={styles.sectionLink}>All courses →</Link>
          </div>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((c, i) => (
              <Link key={c.label} href={c.href} className={`${styles.categoryCard} animate-fade-up delay-${i + 1}`}>
                <div className={styles.categoryCardInner} style={{ background: c.bg }}>
                  <span className={styles.categoryIcon}>{c.icon}</span>
                </div>
                <p className={styles.categoryLabel}>{c.label}</p>
                <p className={styles.categorySub}>{c.sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogoMark}>LL</div>
              <p className={styles.footerBrandText}>
                Premium lash supplies and education for professionals worldwide.
              </p>
            </div>
            {FOOTER_COLS.map(col => (
              <div key={col.title} className={styles.footerCol}>
                <p className={styles.footerColTitle}>{col.title}</p>
                {col.links.map(l => (
                  <Link key={l.label} href={l.href} className={styles.footerLink}>{l.label}</Link>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.footerCopy}>© {new Date().getFullYear()} Lanna Lashes. All rights reserved.</p>
            <div className={styles.footerLegal}>
              <a href="#" className={styles.footerLink}>Privacy</a>
              <a href="#" className={styles.footerLink}>Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Static content ────────────────────────────────────────────────────────────

const PILLARS = [
  { icon: '◫', title: 'Premium Supplies',  desc: 'Lashes, adhesives, tools — everything a professional needs.',     href: '/shop',       cta: 'Shop Now' },
  { icon: '◈', title: 'Lanna Academy',     desc: 'Professional courses taught by industry experts.',                  href: '/academy',    cta: 'Browse Courses' },
  { icon: '◎', title: 'The Blueprint',     desc: 'Monthly live calls and weekly videos with Alanna herself.',         href: '/mentorship', cta: 'Join Now' },
];

const CATEGORIES = [
  { label: 'Online Courses',     sub: 'Video tutorials',       href: '/academy',    icon: '🎬', bg: '#1a1a1a' },
  { label: 'eBooks',             sub: 'Digital downloads',     href: '/shop',       icon: '📖', bg: '#343433' },
  { label: 'In-Person Training', sub: 'Miami, FL',             href: '/shop',       icon: '📍', bg: '#5a5857' },
  { label: 'Live Mentorship',    sub: 'Monthly calls w/ Alanna', href: '/mentorship', icon: '📞', bg: '#2a2a2a' },
];

const FOOTER_COLS = [
  { title: 'Shop',    links: [{ label: 'All Products', href: '/shop' }, { label: 'Lash Trays', href: '/shop' }, { label: 'Adhesive', href: '/shop' }, { label: 'Kits', href: '/shop' }, { label: 'eBooks', href: '/shop' }] },
  { title: 'Learn',   links: [{ label: 'All Courses', href: '/academy' }, { label: 'Online Training', href: '/academy' }, { label: 'Blueprint', href: '/mentorship' }, { label: 'Community', href: '/community' }] },
  { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Contact', href: 'mailto:support@lannalashes.com' }, { label: 'Instagram', href: 'https://instagram.com/lannalashes' }] },
];
