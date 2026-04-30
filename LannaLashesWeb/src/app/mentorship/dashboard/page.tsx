'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiGet, apiPost } from '@/services/api';
import styles from './dashboard.module.css';

interface Video {
  id: string; title: string; description: string;
  videoUrl: string; thumbnail: string | null; duration: number; publishedAt: string;
}

interface Call {
  id: string; title: string; description: string | null;
  scheduledAt: string; meetUrl: string | null; recordingUrl: string | null;
  duration: number; isCompleted: boolean;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim();
}

function isUpcoming(d: string) {
  return new Date(d) > new Date();
}

export default function MentorshipDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab]               = useState<'videos' | 'calls'>('videos');
  const [subscription, setSub]      = useState<any>(null);
  const [videos, setVideos]         = useState<Video[]>([]);
  const [calls, setCalls]           = useState<Call[]>([]);
  const [loading, setLoading]       = useState(true);
  const [portalLoading, setPortal]  = useState(false);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (!user) { router.push('/auth?redirect=/mentorship/dashboard'); return; }

    Promise.all([
      apiGet<any>('/api/mentorship/subscription'),
      apiGet<Video[]>('/api/mentorship/videos'),
      apiGet<Call[]>('/api/mentorship/calls'),
    ])
      .then(([sub, vids, cls]) => {
        if (!sub || sub.status !== 'active') { router.push('/mentorship'); return; }
        setSub(sub);
        setVideos(vids);
        setCalls(cls);
        setActiveVideo(vids[0] ?? null);
      })
      .catch(() => router.push('/mentorship'))
      .finally(() => setLoading(false));
  }, [user, router]);

  async function handlePortal() {
    setPortal(true);
    try {
      const { url } = await apiPost<{ url: string }>('/api/mentorship/portal', {});
      window.location.href = url;
    } finally {
      setPortal(false);
    }
  }

  if (loading) return (
    <div className={styles.page}>
      <div className={`skeleton ${styles.headerSkel}`} />
      <div className={styles.skelBody}>
        {[1,2,3].map(i => <div key={i} className={`skeleton ${styles.cardSkel}`} />)}
      </div>
    </div>
  );

  const upcomingCalls = calls.filter(c => !c.isCompleted && isUpcoming(c.scheduledAt));
  const pastCalls     = calls.filter(c => c.isCompleted || !isUpcoming(c.scheduledAt));
  const PLAN_LABELS: Record<string, string> = {
    monthly: 'Monthly', biannual: '6-Month', annual: 'Annual',
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <p className={styles.headerLabel}>Mentorship Dashboard</p>
            <h1 className={styles.headerTitle}>Welcome back, {user?.firstName}</h1>
          </div>
          <div className={styles.headerMeta}>
            {subscription && (
              <div className={styles.subInfo}>
                <span className={styles.subBadge}>{PLAN_LABELS[subscription.plan]}</span>
                <span className={styles.subRenew}>
                  {subscription.cancelAtPeriodEnd
                    ? `Access until ${formatDate(subscription.currentPeriodEnd)}`
                    : `Renews ${formatDate(subscription.currentPeriodEnd)}`}
                </span>
              </div>
            )}
            <button className={styles.manageBtn} onClick={handlePortal} disabled={portalLoading}>
              {portalLoading ? 'Loading…' : 'Manage Billing'}
            </button>
          </div>
        </div>
      </div>

      {/* Next call banner */}
      {upcomingCalls[0] && (
        <div className={styles.callBanner}>
          <div className={styles.callBannerInner}>
            <div className={styles.callBannerLeft}>
              <span className={styles.liveDot} />
              <div>
                <p className={styles.callBannerLabel}>Next Live Call</p>
                <p className={styles.callBannerTitle}>{upcomingCalls[0].title}</p>
                <p className={styles.callBannerDate}>
                  {formatDate(upcomingCalls[0].scheduledAt)} · {formatDuration(upcomingCalls[0].duration)}
                </p>
              </div>
            </div>
            {upcomingCalls[0].meetUrl && (
              <a
                href={upcomingCalls[0].meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.joinBtn}
              >
                Join Google Meet →
              </a>
            )}
          </div>
        </div>
      )}

      <div className={styles.body}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'videos' ? styles.tabActive : ''}`} onClick={() => setTab('videos')}>
            Weekly Videos <span className={styles.tabCount}>{videos.length}</span>
          </button>
          <button className={`${styles.tab} ${tab === 'calls' ? styles.tabActive : ''}`} onClick={() => setTab('calls')}>
            Monthly Calls <span className={styles.tabCount}>{calls.length}</span>
          </button>
        </div>

        {/* Videos tab */}
        {tab === 'videos' && (
          <div className={styles.videoLayout}>
            {/* Player */}
            {activeVideo && (
              <div className={styles.player}>
                <div className={styles.playerFrame}>
                  <iframe
                    src={activeVideo.videoUrl}
                    className={styles.iframe}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={activeVideo.title}
                  />
                </div>
                <div className={styles.playerInfo}>
                  <p className={styles.playerDate}>{formatDate(activeVideo.publishedAt)}</p>
                  <h2 className={styles.playerTitle}>{activeVideo.title}</h2>
                  <p className={styles.playerDesc}>{activeVideo.description}</p>
                </div>
              </div>
            )}

            {/* Video list */}
            <div className={styles.videoList}>
              {videos.length === 0 ? (
                <div className={styles.empty}>
                  <p>New videos drop every week. Check back soon!</p>
                </div>
              ) : (
                videos.map(v => (
                  <button
                    key={v.id}
                    className={`${styles.videoItem} ${activeVideo?.id === v.id ? styles.videoItemActive : ''}`}
                    onClick={() => setActiveVideo(v)}
                  >
                    <div className={styles.videoThumb}>
                      {v.thumbnail
                        ? <img src={v.thumbnail} alt={v.title} className={styles.thumbImg} />
                        : <span className={styles.thumbLL}>LL</span>
                      }
                    </div>
                    <div className={styles.videoMeta}>
                      <p className={styles.videoTitle}>{v.title}</p>
                      <p className={styles.videoDate}>{formatDate(v.publishedAt)} · {formatDuration(v.duration)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Calls tab */}
        {tab === 'calls' && (
          <div className={styles.callsList}>
            {upcomingCalls.length > 0 && (
              <div className={styles.callSection}>
                <h3 className={styles.callSectionTitle}>Upcoming</h3>
                {upcomingCalls.map(call => (
                  <div key={call.id} className={`${styles.callCard} ${styles.callCardUpcoming}`}>
                    <div className={styles.callInfo}>
                      <p className={styles.callTitle}>{call.title}</p>
                      <p className={styles.callDate}>{formatDate(call.scheduledAt)} · {formatDuration(call.duration)}</p>
                      {call.description && <p className={styles.callDesc}>{call.description}</p>}
                    </div>
                    {call.meetUrl && (
                      <a href={call.meetUrl} target="_blank" rel="noopener noreferrer" className={styles.callJoinBtn}>
                        Join Meeting →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.callSection}>
              <h3 className={styles.callSectionTitle}>Past Calls</h3>
              {pastCalls.length === 0 ? (
                <div className={styles.empty}><p>Past call recordings will appear here.</p></div>
              ) : (
                pastCalls.map(call => (
                  <div key={call.id} className={styles.callCard}>
                    <div className={styles.callInfo}>
                      <p className={styles.callTitle}>{call.title}</p>
                      <p className={styles.callDate}>{formatDate(call.scheduledAt)} · {formatDuration(call.duration)}</p>
                      {call.description && <p className={styles.callDesc}>{call.description}</p>}
                    </div>
                    {call.recordingUrl ? (
                      <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer" className={styles.callRecordingBtn}>
                        ▶ Watch Recording
                      </a>
                    ) : (
                      <span className={styles.callPending}>Recording coming soon</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
