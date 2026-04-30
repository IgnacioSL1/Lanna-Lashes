'use client';
import { useState, useEffect, useCallback } from 'react';
import { CommunityAPI, Post } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import styles from './community.module.css';

const TAGS = ['All Posts', 'Questions', 'Inspo', 'My Work', 'Tips'];
const TAG_MAP: Record<string, string | undefined> = {
  'All Posts': undefined, 'Questions': 'question', 'Inspo': 'inspo', 'My Work': 'my_work', 'Tips': 'tip',
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [posts, setPosts]         = useState<Post[]>([]);
  const [stats, setStats]         = useState({ memberCount: 0, postsToday: 0, liveNow: 0 });
  const [tag, setTag]             = useState('All Posts');
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost]     = useState('');
  const [postTag, setPostTag]     = useState('general');
  const [isPosting, setIsPosting] = useState(false);
  const [cursor, setCursor]       = useState<string | null>(null);

  const load = useCallback(async (reset = true) => {
    if (reset) setIsLoading(true);
    try {
      const [postsRes, statsRes] = await Promise.all([
        CommunityAPI.getPosts(TAG_MAP[tag]),
        CommunityAPI.getStats(),
      ]);
      setPosts(reset ? postsRes.posts : prev => [...prev, ...postsRes.posts]);
      setCursor(postsRes.nextCursor);
      setStats(statsRes);
    } finally {
      setIsLoading(false);
    }
  }, [tag]);

  useEffect(() => { load(); }, [load]);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated()) return;
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
      : p
    ));
    await CommunityAPI.likePost(postId).catch(() => {});
  };

  const handlePost = async () => {
    if (!newPost.trim() || !isAuthenticated()) return;
    setIsPosting(true);
    try {
      const post = await CommunityAPI.createPost(newPost.trim(), postTag);
      setPosts(prev => [post, ...prev]);
      setNewPost('');
    } finally {
      setIsPosting(false);
    }
  };

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <p className={styles.headerLabel}>The Lanna Circle</p>
            <h1 className={styles.headerTitle}>Connect. Learn. Grow.</h1>
          </div>
          <div className={styles.statsBar}>
            {[
              [stats.memberCount.toLocaleString(), 'Members'],
              [stats.postsToday, 'Posts today'],
              [stats.liveNow, 'Live now'],
            ].map(([n, l], i) => (
              <div key={String(l)} className={styles.stat}>
                <span className={styles.statNum}>{n}</span>
                <span className={styles.statLabel}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.feed}>
          {/* New post box */}
          {isAuthenticated() ? (
            <div className={styles.newPostBox}>
              <div className={styles.newPostTop}>
                <div className={styles.avatar}>{user ? initials(`${user.firstName} ${user.lastName}`) : '?'}</div>
                <textarea
                  className={styles.newPostInput}
                  placeholder="Share something with the community..."
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.newPostActions}>
                <select
                  className={styles.tagSelect}
                  value={postTag}
                  onChange={e => setPostTag(e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="question">Question</option>
                  <option value="my_work">My Work</option>
                  <option value="inspo">Inspo</option>
                  <option value="tip">Tip</option>
                </select>
                <button
                  className={styles.postBtn}
                  onClick={handlePost}
                  disabled={!newPost.trim() || isPosting}
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.signInPrompt}>
              <p>Join the conversation</p>
              <Link href="/auth" className={styles.signInLink}>Sign in to post →</Link>
            </div>
          )}

          {/* Tag filters */}
          <div className={styles.tagRow}>
            {TAGS.map(t => (
              <button
                key={t}
                className={`${styles.tagChip} ${tag === t ? styles.tagChipActive : ''}`}
                onClick={() => setTag(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Posts */}
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeletonPost}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 18, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 12, width: '30%' }} />
                  <div className="skeleton" style={{ height: 14, width: '90%' }} />
                  <div className="skeleton" style={{ height: 14, width: '75%' }} />
                </div>
              </div>
            ))
          ) : (
            posts.map((post, i) => (
              <div key={post.id} className={`${styles.postCard} animate-fade-up`} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className={styles.postHeader}>
                  <div className={styles.avatar}>
                    {post.author.avatar
                      ? <img src={post.author.avatar} alt="" className={styles.avatarImg} />
                      : initials(`${post.author.firstName} ${post.author.lastName}`)
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className={styles.postAuthor}>{post.author.firstName} {post.author.lastName}</span>
                    <span className={styles.postTime}>{timeAgo(post.createdAt)}</span>
                  </div>
                  <span className={styles.postTagPill}>{post.tag.replace('_', ' ')}</span>
                </div>
                <p className={styles.postContent}>{post.content}</p>
                {post.images?.[0] && (
                  <img src={post.images[0]} alt="" className={styles.postImage} />
                )}
                <div className={styles.postActions}>
                  <button
                    className={`${styles.postAction} ${post.isLiked ? styles.postActionLiked : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    ♥ {post.likeCount}
                  </button>
                  <Link href={`/community/${post.id}`} className={styles.postAction}>
                    💬 {post.commentCount}
                  </Link>
                </div>
              </div>
            ))
          )}

          {cursor && (
            <button className={styles.loadMoreBtn} onClick={() => load(false)}>
              Load more posts
            </button>
          )}
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>Community Guidelines</h3>
            {['Be kind and supportive', 'Tag your posts correctly', 'Share your work freely', 'Ask questions openly', 'No self-promotion spam'].map(r => (
              <p key={r} className={styles.sidebarRule}>✓ {r}</p>
            ))}
          </div>
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>Featured Courses</h3>
            {[
              { title: 'Classic Foundations', price: 149, slug: 'classic-foundations' },
              { title: 'Russian Volume', price: 249, slug: 'russian-volume' },
            ].map(c => (
              <Link key={c.slug} href={`/academy/${c.slug}`} className={styles.sidebarCourse}>
                <span className={styles.sidebarCourseTitle}>{c.title}</span>
                <span className={styles.sidebarCoursePrice}>${c.price}</span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
