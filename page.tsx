import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={`${styles.heroEyebrow} animate-fade-up`}>New Collection 2024</p>
          <h1 className={`${styles.heroTitle} animate-fade-up delay-1`}>
            The Art of<br />Perfect Lashes
          </h1>
          <p className={`${styles.heroSub} animate-fade-up delay-2`}>
            Premium supplies, professional courses,<br />and a community that lifts each other up.
          </p>
          <div className={`${styles.heroCtas} animate-fade-up delay-3`}>
            <Link href="/shop" className={styles.ctaPrimary}>Shop Now</Link>
            <Link href="/academy" className={styles.ctaSecondary}>Explore Courses</Link>
          </div>
        </div>
        <div className={styles.heroDecor}>
          <span className={styles.heroLL}>LL</span>
        </div>
      </section>

      {/* ── Three pillars ─────────────────────────────────────────────────── */}
      <section className={styles.pillars}>
        <div className={styles.container}>
          {[
            { icon: '◫', title: 'Premium Supplies', desc: 'Lashes, adhesives, tools — everything a professional needs, sourced to the highest standard.', href: '/shop', cta: 'Shop Now' },
            { icon: '◈', title: 'Lanna Academy', desc: 'From classic foundations to advanced volume — professional courses taught by industry experts.', href: '/academy', cta: 'Browse Courses' },
            { icon: '◎', title: 'The Circle', desc: 'A private community of 8,400+ lash artists. Share your work, ask questions, grow together.', href: '/community', cta: 'Join Community' },
          ].map((p, i) => (
            <div key={p.title} className={`${styles.pillar} animate-fade-up delay-${i + 1}`}>
              <span className={styles.pillarIcon}>{p.icon}</span>
              <h3 className={styles.pillarTitle}>{p.title}</h3>
              <p className={styles.pillarDesc}>{p.desc}</p>
              <Link href={p.href} className={styles.pillarLink}>{p.cta} →</Link>
            </div>
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
            {FEATURED_PRODUCTS.map((p, i) => (
              <Link
                key={p.id}
                href={`/shop/${p.handle}`}
                className={`${styles.productCard} animate-fade-up delay-${i + 1}`}
              >
                <div className={styles.productImage}>
                  <span className={styles.productLL}>LL</span>
                  {p.badge && <span className={styles.productBadge}>{p.badge}</span>}
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.productCategory}>{p.category}</span>
                  <h4 className={styles.productName}>{p.name}</h4>
                  <div className={styles.productPriceRow}>
                    {p.compareAt && <span className={styles.productOldPrice}>${p.compareAt}</span>}
                    <span className={styles.productPrice}>${p.price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Academy banner ────────────────────────────────────────────────── */}
      <section className={styles.academyBanner}>
        <div className={styles.container}>
          <div className={styles.academyBannerInner}>
            <div className={styles.academyBannerContent}>
              <p className={styles.sectionLabel} style={{ color: 'rgba(255,255,255,0.5)' }}>Lanna Academy</p>
              <h2 className={styles.academyBannerTitle}>Master Every Technique</h2>
              <p className={styles.academyBannerSub}>
                From classic singles to mega volume fans — our courses take you from beginner to pro.
              </p>
              <div className={styles.academyStats}>
                {[['3,200+', 'Students'], ['15+', 'Courses'], ['4.9', 'Avg rating']].map(([n, l]) => (
                  <div key={l} className={styles.academyStat}>
                    <span className={styles.academyStatNum}>{n}</span>
                    <span className={styles.academyStatLabel}>{l}</span>
                  </div>
                ))}
              </div>
              <Link href="/academy" className={styles.academyBannerCta}>Browse All Courses →</Link>
            </div>
            <div className={styles.academyBannerCourses}>
              {FEATURED_COURSES.map(c => (
                <Link key={c.id} href={`/academy/${c.slug}`} className={styles.courseCard}>
                  <div className={styles.courseThumb} style={{ background: c.color }}>
                    <span className={styles.courseThumbLL}>LL</span>
                    <span className={styles.courseLevelBadge}>{c.level}</span>
                  </div>
                  <div className={styles.courseCardBody}>
                    <span className={styles.courseCategory}>{c.category}</span>
                    <h4 className={styles.courseCardTitle}>{c.title}</h4>
                    <div className={styles.courseCardFooter}>
                      <span className={styles.coursePrice}>${c.price}</span>
                      <span className={styles.courseMeta}>{c.lessons} lessons</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Community teaser ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.communityTeaser}>
            <div className={styles.communityTeaserContent}>
              <p className={styles.sectionLabel}>The Lanna Circle</p>
              <h2 className={styles.sectionTitle}>Join 8,400+ Lash Artists</h2>
              <p className={styles.communityDesc}>
                Share your work, get answers to technique questions, and be part of a community that celebrates every set.
              </p>
              <Link href="/community" className={styles.ctaPrimary} style={{ display: 'inline-block', marginTop: 24 }}>
                Join the Community →
              </Link>
            </div>
            <div className={styles.communityPosts}>
              {SAMPLE_POSTS.map((post, i) => (
                <div key={i} className={`${styles.communityPost} animate-fade-up delay-${i + 1}`}>
                  <div className={styles.postAvatar}>{post.initials}</div>
                  <div className={styles.postContent}>
                    <span className={styles.postAuthor}>{post.author}</span>
                    <p className={styles.postText}>{post.text}</p>
                  </div>
                </div>
              ))}
            </div>
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
            {[
              { title: 'Shop', links: ['All Products', 'Lashes', 'Adhesives', 'Tools', 'Bundles'] },
              { title: 'Learn', links: ['All Courses', 'Beginner', 'Intermediate', 'Advanced', 'Business'] },
              { title: 'Company', links: ['About', 'Community', 'Blog', 'Contact', 'Careers'] },
            ].map(col => (
              <div key={col.title} className={styles.footerCol}>
                <p className={styles.footerColTitle}>{col.title}</p>
                {col.links.map(l => <a key={l} href="#" className={styles.footerLink}>{l}</a>)}
              </div>
            ))}
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.footerCopy}>© 2024 Lanna Lashes. All rights reserved.</p>
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

// ── Sample data ───────────────────────────────────────────────────────────────

const FEATURED_PRODUCTS = [
  { id: '1', handle: 'classic-lash-set',    name: 'Classic Lash Set',    category: 'Lashes',    price: 38,  compareAt: null, badge: 'New'  },
  { id: '2', handle: 'mega-volume-fans',    name: 'Mega Volume Fans',    category: 'Lashes',    price: 45,  compareAt: null, badge: null   },
  { id: '3', handle: 'pro-lash-glue',       name: 'Pro Lash Glue',       category: 'Adhesives', price: 16,  compareAt: 22,   badge: 'Sale' },
  { id: '4', handle: 'starter-kit-bundle',  name: 'Starter Kit Bundle',  category: 'Bundles',   price: 89,  compareAt: null, badge: null   },
];

const FEATURED_COURSES = [
  { id: '1', slug: 'classic-foundations',  title: 'Classic Foundations',   category: 'Classic',  level: 'Beginner',     price: 149, lessons: 12, color: '#1a1a1a' },
  { id: '2', slug: 'russian-volume',       title: 'Russian Volume Mastery', category: 'Volume',   level: 'Intermediate', price: 249, lessons: 18, color: '#343433' },
  { id: '3', slug: 'lash-business',        title: 'Launch Your Business',   category: 'Business', level: 'Advanced',     price: 349, lessons: 22, color: '#5a5857' },
];

const SAMPLE_POSTS = [
  { initials: 'SM', author: 'Sarah M.', text: 'Just finished my first mega volume set using the techniques from the Russian Volume course. Absolutely obsessed! 🖤' },
  { initials: 'JT', author: 'Jessica T.', text: 'Best investment I\'ve made in my lash career. The community here is so supportive and the courses are elite.' },
  { initials: 'AK', author: 'Alana K.', text: 'Pro Lash Glue is a game changer — perfect retention in humid weather. Finally found my HEA with an adhesive!' },
];
