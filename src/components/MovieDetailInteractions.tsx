'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const RATING_LABELS: Record<number, string> = {
  1: '很差',
  2: '较差',
  3: '还行',
  4: '推荐',
  5: '力荐',
};

export function MovieActionButtons({
  doubanId,
  title,
  initialStatus,
  initialRating,
  initialComment,
  isLoggedIn,
  watchedCount,
  wishCount,
}: {
  doubanId: string;
  title: string;
  initialStatus?: string | null;
  initialRating?: number | null;
  initialComment?: string | null;
  isLoggedIn: boolean;
  watchedCount: number;
  wishCount: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(initialStatus || null);
  const [rating, setRating] = useState<number>(initialRating || 5);
  const [comment, setComment] = useState<string>(initialComment || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localWatchedCount, setLocalWatchedCount] = useState(watchedCount);
  const [localWishCount, setLocalWishCount] = useState(wishCount);

  const handleToggleWish = async () => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    const res = await fetch(`/api/user-movies/${doubanId}/wish`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      setStatus(data.status);
      setLocalWishCount((prev) => (data.wished ? prev + 1 : Math.max(0, prev - 1)));
      router.refresh();
    }
  };

  const handleOpenWatched = () => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    setModalOpen(true);
  };

  const handleSubmitWatched = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/user-movies/${doubanId}/watched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      if (res.ok) {
        if (status !== 'watched') {
          setLocalWatchedCount((prev) => prev + 1);
        }
        setStatus('watched');
        setModalOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="detail-actions-row movie-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '16px' }}>
        <Link href={`/watch/${doubanId}`} className="btn-play-primary">
          ▶ 立即播放
        </Link>
        <button
          type="button"
          id="wish-btn"
          onClick={handleToggleWish}
          className={`action-btn btn-mark ${status === 'wish' ? 'active' : ''}`}
        >
          {status === 'wish' ? '✓ 已想看' : '♡ 想看'}
        </button>
        <button
          type="button"
          id="watched-btn"
          onClick={handleOpenWatched}
          className={`action-btn btn-mark ${status === 'watched' ? 'active' : ''}`}
        >
          {status === 'watched' ? `✓ 已看过 ${rating ? `${rating}★` : ''}` : '☆ 看过'}
        </button>
        <span className="social-stats-text movie-social-stats" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
          {localWatchedCount} 人看过 · {localWishCount} 人想看
        </span>
      </div>

      {modalOpen && (
        <div
          id="mark-watched-modal"
          className="action-modal-overlay active modal-overlay"
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="action-modal modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '24px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.28)',
            }}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="action-modal-title" style={{ margin: 0, fontSize: '18px' }}>
                标记看过 — 《{title}》
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="关闭"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitWatched} className="modal-body">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  我的评分：{RATING_LABELS[rating]} ({rating} 星)
                </label>
                <div className="score-selector" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      data-score={star}
                      onClick={() => setRating(star)}
                      className={`score-chip rating-chip ${rating === star ? 'selected active' : ''}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: rating === star ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: rating === star ? 'var(--accent-light)' : 'var(--bg-secondary)',
                        color: rating === star ? 'var(--accent)' : 'var(--text)',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      <span className="score-num">{star}分</span>{' '}
                      <span className="score-label">{RATING_LABELS[star]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="watched-comment" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  写一句短评（选填，最多 500 字）
                </label>
                <textarea
                  id="watched-comment"
                  className="action-modal-textarea"
                  rows={4}
                  maxLength={500}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="写下你的短评（选填）..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div className="action-modal-btns" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="action-modal-cancel btn-secondary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="action-modal-submit btn-primary"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--accent-solid)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {saving ? '保存中...' : '确定标记'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function BackdropsGallery({ backdrops, title }: { backdrops: string[]; title: string }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  React.useEffect(() => {
    if (lightboxIdx === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIdx(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIdx((prev) =>
          prev !== null ? (prev - 1 + backdrops.length) % backdrops.length : null
        );
      } else if (e.key === 'ArrowRight') {
        setLightboxIdx((prev) => (prev !== null ? (prev + 1) % backdrops.length : null));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIdx, backdrops.length]);

  if (!backdrops || backdrops.length === 0) return null;
  const visible = expanded ? backdrops : backdrops.slice(0, 4);

  const stepPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIdx((prev) =>
      prev !== null ? (prev - 1 + backdrops.length) % backdrops.length : 0
    );
  };

  const stepNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIdx((prev) => (prev !== null ? (prev + 1) % backdrops.length : 0));
  };

  return (
    <section className="detail-section movie-backdrops" id="backdropsSection" style={{ marginTop: '28px' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">剧照 / 壁纸 ({backdrops.length})</h2>
        {backdrops.length > 4 && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {expanded ? '收起剧照' : `展开全部 (${backdrops.length})`}
          </button>
        )}
      </div>
      <div
        className="backdrops-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '12px',
        }}
      >
        {visible.map((url, idx) => (
          <button
            key={url + idx}
            type="button"
            className="backdrop-item"
            onClick={() => setLightboxIdx(idx)}
            style={{
              border: 'none',
              padding: 0,
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'zoom-in',
              aspectRatio: '16 / 9',
              background: 'var(--bg-secondary)',
            }}
          >
            <img
              src={url}
              alt={`${title} 剧照 ${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div
          id="backdropLightbox"
          className="backdrop-lightbox active"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIdx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <button
            type="button"
            className="lightbox-close"
            aria-label="关闭"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx(null);
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>

          {backdrops.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-prev"
              aria-label="上一张"
              onClick={stepPrev}
              style={{
                position: 'absolute',
                left: '24px',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                fontSize: '26px',
                cursor: 'pointer',
              }}
            >
              ‹
            </button>
          )}

          <img
            id="lightboxImg"
            className="lightbox-img"
            src={backdrops[lightboxIdx]}
            alt={`${title} 剧照 ${lightboxIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '88vw', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain' }}
          />

          {backdrops.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-next"
              aria-label="下一张"
              onClick={stepNext}
              style={{
                position: 'absolute',
                right: '24px',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                fontSize: '26px',
                cursor: 'pointer',
              }}
            >
              ›
            </button>
          )}

          <div
            id="lightboxCounter"
            className="lightbox-counter"
            style={{
              position: 'absolute',
              bottom: '20px',
              padding: '4px 12px',
              borderRadius: '14px',
              background: 'rgba(0,0,0,0.65)',
              color: '#fff',
              fontSize: '13px',
            }}
          >
            {lightboxIdx + 1} / {backdrops.length}
          </div>
        </div>
      )}
    </section>
  );
}

export type ReviewCommentView = {
  id: string;
  doubanId?: string;
  movieTitle?: string;
  movieYear?: string;
  userId?: string | null;
  profileId?: string | null;
  authorId?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  rating: number;
  content: string;
  likesCount: number;
  likedByMe?: boolean;
  createdAt: string;
  replies?: Array<{
    id: string;
    authorId?: string | null;
    authorName: string;
    authorAvatar?: string | null;
    content: string;
    createdAt: string;
  }>;
};

export function ShortReviewCard({
  review,
  showMovieTitle = false,
  isLoggedIn = false,
}: {
  review: ReviewCommentView;
  showMovieTitle?: boolean;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(review.likesCount);
  const [liked, setLiked] = useState(false);
  const [showReplies, setShowReplies] = useState(Boolean(review.replies && review.replies.length > 0));
  const [replies, setReplies] = useState(review.replies || []);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const authorProfileLink = review.profileId
    ? `/user/${review.profileId}`
    : review.userId
      ? `/user/${review.userId}`
      : null;

  const handleLike = async () => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    const res = await fetch(`/api/comments/${review.id}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    }
  };

  const handleToggleReplies = async () => {
    const next = !showReplies;
    setShowReplies(next);
    if (next && replies.length === 0) {
      const res = await fetch(`/api/comments/${review.id}/replies`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.items || []);
      }
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${review.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setReplies((prev) => [...prev, data.reply]);
          setReplyText('');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="review-card"
      style={{
        padding: '16px',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{review.authorAvatar || '🎬'}</span>
          {authorProfileLink ? (
            <Link href={authorProfileLink} style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
              {review.authorName}
            </Link>
          ) : (
            <span style={{ fontWeight: 600 }}>{review.authorName}</span>
          )}
          <span style={{ color: '#f5a623', fontSize: '13px' }}>{'★'.repeat(review.rating)}</span>
        </div>
        <Link
          href={`/review/${review.id}`}
          style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}
          title="短评永久链接"
        >
          {new Date(review.createdAt).toLocaleDateString('zh-CN')} ↗
        </Link>
      </div>

      {showMovieTitle && review.movieTitle && (
        <div style={{ fontSize: '13px' }}>
          评{' '}
          <Link href={`/movie/${review.doubanId}`} style={{ color: 'var(--accent)', fontWeight: 500 }}>
            《{review.movieTitle}》{review.movieYear ? ` (${review.movieYear})` : ''}
          </Link>
        </div>
      )}

      <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--text)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
        {review.content}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={handleLike}
          style={{
            background: 'none',
            border: 'none',
            color: liked ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: 0,
          }}
        >
          👍 有用 ({likesCount})
        </button>
        <button
          type="button"
          onClick={handleToggleReplies}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            padding: 0,
          }}
        >
          💬 回复 ({replies.length})
        </button>
      </div>

      {showReplies && (
        <div
          style={{
            marginTop: '8px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {replies.map((r) => (
            <div key={r.id} style={{ fontSize: '13px', lineHeight: 1.5 }}>
              <strong>
                {r.authorAvatar} {r.authorName}：
              </strong>
              <span>{r.content}</span>
            </div>
          ))}
          <form onSubmit={handleReplySubmit} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="写下你的回复..."
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '13px',
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent-solid)',
                color: '#fff',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              发送
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function FollowButton({
  targetId,
  targetUserId,
  initialFollowing = false,
  initialFollowersCount,
  isLoggedIn = false,
}: {
  targetId?: string;
  targetUserId?: string;
  initialFollowing?: boolean;
  initialFollowersCount?: number;
  isLoggedIn?: boolean;
}) {
  const effectiveTargetId = targetId || targetUserId || '';
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followersCount, setFollowersCount] = useState<number | undefined>(initialFollowersCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(effectiveTargetId)}/follow`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        const nextFollow = Boolean(data.following);
        setFollowing(nextFollow);
        if (followersCount !== undefined) {
          setFollowersCount((prev) =>
            prev !== undefined ? (nextFollow ? prev + 1 : Math.max(0, prev - 1)) : undefined
          );
        }
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`btn-follow ${following ? 'following' : ''}`}
      style={{
        padding: '6px 14px',
        borderRadius: '20px',
        border: following ? '1px solid var(--border)' : '1px solid var(--accent)',
        background: following ? 'var(--bg)' : 'var(--accent-solid)',
        color: following ? 'var(--text-secondary)' : '#fff',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {following ? '✓ 已关注' : '+ 关注'}
      {followersCount !== undefined ? ` ${followersCount}` : ''}
    </button>
  );
}

export function ShareProfileButton({
  userId,
  label = '分享',
}: {
  userId: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const shareUrl = `${window.location.origin}/user/${encodeURIComponent(userId)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // ignore fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn-share-profile"
      style={{
        padding: '6px 14px',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span>🔗 {copied ? '已复制主页链接' : label}</span>
    </button>
  );
}

export const FollowUserButton = FollowButton;
