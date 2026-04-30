'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiPost, apiGet } from '@/services/api';
import styles from './mentorship.module.css';

const PLANS = [
  {
    id:       'monthly',
    name:     'Monthly',
    price:    '$87',
    period:   'per month',
    billing:  'Billed monthly — cancel any time',
    badge:    null,
    perMonth: null,
  },
  {
    id:        'biannual',
    name:      '6 Months',
    price:     '$435',
    period:    'every 6 months',
    billing:   'Billed once every 6 months',
    badge:     '1 month free',
    perMonth:  '$72.50/mo',
    highlight: true,
  },
  {
    id:       'annual',
    name:     'Annual',
    price:    '$870',
    period:   'per year',
    billing:  'Billed once per year',
    badge:    '2 months free',
    perMonth: '$72.50/mo',
  },
];

const MODULES = [
  {
    number: '01',
    title:  'Content That Books Clients',
    body:   'Learn the exact content strategy Alanna uses to attract paying clients — not just followers. No ads, no dancing, no guessing.',
  },
  {
    number: '02',
    title:  'Client Retention System',
    body:   'Turn one-time clients into lifelong loyalists. Build the referral machine that fills your books on autopilot.',
  },
  {
    number: '03',
    title:  'Finances Like a Boss',
    body:   'Pricing, profit margins, taxes, and savings — finally understand the numbers behind your beauty business.',
  },
  {
    number: '04',
    title:  'Avoid Common Mistakes',
    body:   'The costly errors most beauty entrepreneurs make in their first 3 years — and exactly how to sidestep every one of them.',
  },
  {
    number: '05',
    title:  'Live Mentorship & Personalized Support',
    body:   '3 live Q&A calls every month on Wednesdays. Bring your real questions, get real answers — directly from Alanna.',
  },
  {
    number: '06',
    title:  'Build & Scale Your Dream Team',
    body:   'Ready to stop doing everything yourself? Learn how to hire, train, and manage a team that runs without you.',
  },
];

const STATS = [
  { value: '235K+', label: 'Instagram Followers' },
  { value: '13,000+', label: 'Students Taught' },
  { value: '7-Figure', label: 'Beauty Brand' },
  { value: '3×/month', label: 'Live Q&A Calls' },
];

export default function MentorshipPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user }     = useAuthStore();
  const [loading, setLoading]       = useState<string | null>(null);
  const [membership, setMembership] = useState<any>(null);
  const [banner, setBanner]         = useState<'success' | 'canceled' | null>(null);

  useEffect(() => {
    if (searchParams.get('success'))  setBanner('success');
    if (searchParams.get('canceled')) setBanner('canceled');
    if (user) {
      apiGet<any>('/api/mentorship/subscription').then(setMembership).catch(() => {});
    }
  }, [user, searchParams]);

  async function handleJoin(planId: string) {
    if (!user) { router.push('/auth?redirect=/mentorship'); return; }
    setLoading(planId);
    try {
      const { url } = await apiPost<{ url: string }>('/api/mentorship/checkout', { planId });
      window.location.href = url;
    } catch (err: any) {
      alert(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  const isActive = membership?.status === 'active';

  return (
    <div className={styles.page}>

      {/* Banner */}
      {banner === 'success' && (
        <div className={styles.bannerSuccess}>
          🎉 Welcome to the Blueprint! Your dashboard is ready.{' '}
          <Link href="/mentorship/dashboard" className={styles.bannerLink}>Go to Dashboard →</Link>
        </div>
      )}
      {banner === 'canceled' && (
        <div className={styles.bannerCanceled}>
          No worries — your spot is still here whenever you're ready.
        </div>
      )}

      {/* Hero */}
      <div className={styles.hero}>
        <p className={styles.heroLabel}>Lanna Lashes Blueprint</p>
        <h1 className={styles.heroTitle}>
          From Overworked to Booked Out
        </h1>
        <p className={styles.heroSub}>
          How I built a 7-figure beauty brand without ads, a team, or expensive coaches — and how I'll show you to do the same.
        </p>
        {isActive ? (
          <Link href="/mentorship/dashboard" className={styles.dashboardBtn}>
            Go to Your Dashboard →
          </Link>
        ) : (
          <a href="#pricing" className={styles.dashboardBtn}>
            Join the Blueprint →
          </a>
        )}
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        {STATS.map(s => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* What you get */}
      <div className={styles.perks}>
        <div className={styles.perksInner}>
          <p className={styles.sectionLabel}>What's Inside</p>
          <h2 className={styles.sectionTitle}>Everything you need to build a beauty business that lasts</h2>
          <div className={styles.perksGrid}>
            <div className={styles.perkCol}>
              <div className={styles.perk}>
                <span className={styles.perkIcon}>🎬</span>
                <h3 className={styles.perkTitle}>Weekly Video Drops</h3>
                <p className={styles.perkBody}>Every Monday, a new strategy video lands in your dashboard. Business, mindset, marketing — what actually works, straight from someone running a real beauty brand.</p>
              </div>
              <div className={styles.perk}>
                <span className={styles.perkIcon}>📞</span>
                <h3 className={styles.perkTitle}>3 Live Q&A Calls/Month</h3>
                <p className={styles.perkBody}>Join Alanna live on Google Meet every Wednesday — three times a month. Bring your real questions and get direct answers. No scripts, no fluff.</p>
              </div>
              <div className={styles.perk}>
                <span className={styles.perkIcon}>📁</span>
                <h3 className={styles.perkTitle}>Call Recordings</h3>
                <p className={styles.perkBody}>Every live call is recorded and saved in your member dashboard. Miss a session? Catch up on your own time, as many times as you want.</p>
              </div>
            </div>
            <div className={styles.perkCol}>
              <div className={styles.perk}>
                <span className={styles.perkIcon}>💼</span>
                <h3 className={styles.perkTitle}>Real Business Education</h3>
                <p className={styles.perkBody}>Beyond lashes — learn pricing, client retention, hiring, finances, and how to build a brand that generates income even when you're not behind the chair.</p>
              </div>
              <div className={styles.perk}>
                <span className={styles.perkIcon}>🤝</span>
                <h3 className={styles.perkTitle}>Community of Beauty Entrepreneurs</h3>
                <p className={styles.perkBody}>Connect with a tight-knit group of beauty pros who get it. Real talk, honest feedback, and the kind of support you won't find anywhere else.</p>
              </div>
              <div className={styles.perk}>
                <span className={styles.perkIcon}>∞</span>
                <h3 className={styles.perkTitle}>Cancel Any Time</h3>
                <p className={styles.perkBody}>No contracts, no lock-ins, no tricks. This works — and you'll want to stay. But if life happens, cancel in one click, no questions asked.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className={styles.curriculum}>
        <div className={styles.curriculumInner}>
          <p className={styles.sectionLabel}>The Blueprint Curriculum</p>
          <h2 className={styles.sectionTitle}>6 modules built around what actually moves the needle</h2>
          <div className={styles.modules}>
            {MODULES.map(m => (
              <div key={m.number} className={styles.module}>
                <span className={styles.moduleNumber}>{m.number}</span>
                <div className={styles.moduleContent}>
                  <h3 className={styles.moduleTitle}>{m.title}</h3>
                  <p className={styles.moduleBody}>{m.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className={styles.pricing} id="pricing">
        <h2 className={styles.pricingTitle}>Join the Blueprint</h2>
        <p className={styles.pricingSub}>All plans include everything. New content every week. Cancel any time.</p>

        <div className={styles.plans}>
          {PLANS.map(plan => (
            <div key={plan.id} className={`${styles.plan} ${plan.highlight ? styles.planHighlight : ''}`}>
              {plan.badge && <span className={styles.planBadge}>{plan.badge}</span>}
              <p className={styles.planName}>{plan.name}</p>
              <div className={styles.planPrice}>
                <span className={styles.planAmount}>{plan.price}</span>
                <span className={styles.planPeriod}>{plan.period}</span>
              </div>
              {plan.perMonth && (
                <p className={styles.planPerMonth}>({plan.perMonth})</p>
              )}
              <p className={styles.planBilling}>{plan.billing}</p>
              <button
                className={`${styles.planBtn} ${plan.highlight ? styles.planBtnHighlight : ''}`}
                onClick={() => handleJoin(plan.id)}
                disabled={!!loading || isActive}
              >
                {isActive
                  ? 'Already a Member'
                  : loading === plan.id
                  ? 'Redirecting…'
                  : 'Join Now'}
              </button>
            </div>
          ))}
        </div>

        <p className={styles.guarantee}>
          ✓ Secure checkout via Stripe &nbsp;·&nbsp; ✓ Cancel any time &nbsp;·&nbsp; ✓ Instant access after payment
        </p>
      </div>

      {/* About Alanna */}
      <div className={styles.about}>
        <div className={styles.aboutInner}>
          <div className={styles.aboutText}>
            <p className={styles.aboutLabel}>From Alanna</p>
            <h2 className={styles.aboutTitle}>I built this without ads, a team, or a business degree</h2>
            <p className={styles.aboutBody}>
              I started Lanna Lashes with nothing but a set of lashes and a relentless drive to build something real. No roadmap, no mentor, no shortcuts — just years of figuring it out the hard way.
            </p>
            <p className={styles.aboutBody}>
              After growing to 235K+ followers and teaching over 13,000 students, I created the program I wish I'd had: honest, practical, and built specifically for beauty entrepreneurs who are done surviving and ready to thrive.
            </p>
            <p className={styles.aboutBody}>
              Every call, every video, every piece of content inside the Blueprint comes from real experience running a real beauty business. No fluff. No recycled advice. Just what works.
            </p>
          </div>
          <div className={styles.aboutCta}>
            <div className={styles.aboutCard}>
              <p className={styles.aboutCardTitle}>Ready to stop figuring it out alone?</p>
              <p className={styles.aboutCardSub}>Join 13,000+ beauty entrepreneurs inside the Blueprint.</p>
              <a href="#pricing" className={styles.aboutCardBtn}>See Pricing Plans</a>
              {user && isActive && (
                <Link href="/mentorship/dashboard" className={styles.aboutCardSecondary}>
                  Access Your Dashboard →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
