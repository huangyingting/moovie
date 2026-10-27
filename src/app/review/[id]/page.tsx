import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ShortReviewCard, type ReviewCommentView } from '@/components/MovieDetailInteractions';

export const dynamic = 'force-dynamic';

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser().catch(() => null);

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      movie: true,
      user: true,
      profile: true,
      replies: {
        include: {
          user: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      likes: user ? { where: { userId: user.id } } : false,
    },
  });

  if (!comment) {
    notFound();
  }

  const reviewView: ReviewCommentView = {
    id: comment.id,
    doubanId: comment.doubanId,
    rating: comment.rating,
    content: comment.content,
    likesCount: comment.likesCount,
    likedByMe: Array.isArray(comment.likes) && comment.likes.length > 0,
    createdAt: comment.createdAt.toISOString(),
    userId: comment.userId,
    profileId: comment.profileId,
    authorId: comment.profileId || comment.userId || '1102',
    authorName: comment.authorName || comment.user?.name || comment.profile?.username || '影迷',
    authorAvatar: comment.authorAvatar || comment.user?.avatar || comment.profile?.avatar || '🎬',
    replies: comment.replies.map((r) => ({
      id: r.id,
      content: r.content,
      authorName: r.authorName || r.user?.name || '影迷',
      authorAvatar: r.authorAvatar || r.user?.avatar || '🎬',
      authorId: r.userId || '1102',
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <div className="review-detail-page" style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link href={`/movie/${comment.movie.doubanId}`} style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
          ← 返回《{comment.movie.title}》影片详情
        </Link>
      </div>

      {/* Movie Context Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '16px',
          borderRadius: '10px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src={comment.movie.poster}
            alt={comment.movie.title}
            style={{ width: '56px', height: '80px', objectFit: 'cover', borderRadius: '6px' }}
          />
          <div>
            <h1 style={{ fontSize: '18px', margin: '0 0 4px' }}>
              《{comment.movie.title}》片友短评详情
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {comment.movie.year} · {comment.movie.regions} · ★ {comment.movie.rating.toFixed(1)}
            </div>
          </div>
        </div>
        <Link
          href={`/watch/${comment.movie.doubanId}`}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'var(--accent-solid)',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          ▶ 立即播放
        </Link>
      </div>

      <ShortReviewCard review={reviewView} isLoggedIn={Boolean(user)} />
    </div>
  );
}
