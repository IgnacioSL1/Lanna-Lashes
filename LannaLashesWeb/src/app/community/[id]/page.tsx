'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CommunityAPI, Post, Comment } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import styles from './post.module.css';

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function initials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [post, setPost]           = useState<Post | null>(null);
  const [comments, setComments]   = useState<Comment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting]     = useState(false);

  useEffect(() => {
    Promise.all([
      CommunityAPI.getPosts().then(r => r.posts.find(p => p.id === params.id) ?? null),
      CommunityAPI.getComments(params.id),
    ])
      .then(([p, c]) => {
        if (!p) { router.push('/community'); return; }
        setPost(p);
        setComments(c);
      })
      .catch(() => router.push('/community'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  async function handleLike() {
    if (!post || !isAuthenticated()) return;
    setPost(p => p ? {
      ...p,
      isLiked: !p.isLiked,
      likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1,
    } : p);
    await CommunityAPI.likePost(post.id).catch(() => {});
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !post) return;
    setPosting(true);
    try {
      const comment = await CommunityAPI.addComment(post.id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setPost(p => p ? { ...p, commentCount: p.commentCount + 1 } : p);
      setNewComment('');
    } finally {
      setPosting(false);
    }
  }

  if (loading) return (
    <div className={styles.page}>
      <div className={`skeleton ${styles.postSkel}`} />
    </div>
  );

  if (!post) return null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.back} onClick={() => router.back()}>← Community</button>

        {/* Post */}
        <div className={styles.post}>
          <div className={styles.postHeader}>
            <div className={styles.avatar}>
              {post.author.avatar
                ? <img src={post.author.avatar} alt="" className={styles.avatarImg} />
                : initials(post.author.firstName, post.author.lastName)
              }
            </div>
            <div>
              <p className={styles.authorName}>{post.author.firstName} {post.author.lastName}</p>
              <p className={styles.postTime}>{timeAgo(post.createdAt)}</p>
            </div>
            <span className={styles.tagPill}>{post.tag.replace('_', ' ')}</span>
          </div>

          <p className={styles.postContent}>{post.content}</p>

          {post.images?.[0] && (
            <img src={post.images[0]} alt="" className={styles.postImage} />
          )}

          <div className={styles.postActions}>
            <button
              className={`${styles.action} ${post.isLiked ? styles.actionLiked : ''}`}
              onClick={handleLike}
            >
              ♥ {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
            </button>
            <span className={styles.action}>💬 {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
          </div>
        </div>

        {/* Comments */}
        <div className={styles.comments}>
          <h2 className={styles.commentsTitle}>Comments ({comments.length})</h2>

          {/* Comment form */}
          {isAuthenticated() ? (
            <form className={styles.commentForm} onSubmit={handleComment}>
              <div className={styles.avatar} style={{ flexShrink: 0 }}>
                {user ? initials(user.firstName, user.lastName) : '?'}
              </div>
              <div className={styles.commentInputWrap}>
                <textarea
                  className={styles.commentInput}
                  placeholder="Write a comment…"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  rows={2}
                />
                <button
                  type="submit"
                  className={styles.commentBtn}
                  disabled={!newComment.trim() || posting}
                >
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.signInPrompt}>
              <Link href="/auth" className={styles.signInLink}>Sign in to comment →</Link>
            </div>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className={styles.noComments}>No comments yet. Be the first!</p>
          ) : (
            <div className={styles.commentList}>
              {comments.map(comment => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.avatar}>
                    {comment.author.avatar
                      ? <img src={comment.author.avatar} alt="" className={styles.avatarImg} />
                      : initials(comment.author.firstName, comment.author.lastName)
                    }
                  </div>
                  <div className={styles.commentBody}>
                    <div className={styles.commentMeta}>
                      <span className={styles.commentAuthor}>{comment.author.firstName} {comment.author.lastName}</span>
                      <span className={styles.commentTime}>{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className={styles.commentContent}>{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
