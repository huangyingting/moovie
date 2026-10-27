import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  FollowButton,
  ShortReviewCard,
  type ReviewCommentView,
} from '@/components/MovieDetailInteractions';

export const dynamic = 'force-dynamic';

export default async function CommunityFeedPage() {
  const user = await getCurrentUser().catch(() => null);

  const [comments, cinephiles, myFollows] = await Promise.all([
    prisma.comment.findMany({
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
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    prisma.cinephileProfile.findMany({
      include: {
        _count: {
          select: { comments: true },
        },
      },
      take: 6,
    }),
    user
      ? prisma.follow.findMany({
          where: { followerId: user.id },
        })
      : Promise.resolve([]),
  ]);

  const followedSet = new Set(myFollows.map((f) => f.targetId).filter(Boolean));

  return (
    <div className="feed-page" style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Header matching 07-feed.png */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--accent)',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}
          >
            FOLLOWING
          </div>
          <h1 style={{ fontSize: '26px', margin: '0 0 6px' }}>关注动态</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            你关注的片友最近在看什么。
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/following"
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            管理关注
          </Link>
        </div>
      </div>

      {/* Recommended Cinephiles Card when user has 0 follows (matching 07-feed.png) */}
      {followedSet.size === 0 && (
        <section
          style={{
            padding: '28px 24px',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border)',
            marginBottom: '28px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
            你还没有关注任何人。关注几位口味相近的片友，这里就会有他们的观影动态。
          </p>
          <div style={{ maxWidth: '420px', margin: '0 auto', display: 'grid', gap: '10px', textAlign: 'left' }}>
            {cinephiles.map((cp) => (
              <div
                key={cp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}
              >
                <Link
                  href={`/user/${cp.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textDecoration: 'none',
                    color: 'var(--text)',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{cp.avatar || '🎬'}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{cp.username}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      留下 {Math.max(cp._count.comments, 1)} 条短评 · 记录了 {cp.watchedCount} 部电影
                    </div>
                  </div>
                </Link>
                <FollowButton
                  targetId={cp.id}
                  initialFollowing={followedSet.has(cp.id)}
                  isLoggedIn={Boolean(user)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Community / Following Feed Stream */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
          {followedSet.size > 0 ? '已关注片友最新动态' : '全站片友实时短评流'}
        </h2>
      </div>
      <div style={{ display: 'grid', gap: '16px' }}>
        {comments
          .filter((c) => {
            if (followedSet.size === 0) return true;
            const authorId = c.profileId || c.userId;
            return authorId ? followedSet.has(authorId) : true;
          })
          .map((c) => {
            const rev: ReviewCommentView = {
              id: c.id,
              doubanId: c.doubanId,
              rating: c.rating,
              content: c.content,
              likesCount: c.likesCount,
              likedByMe: Array.isArray(c.likes) && c.likes.length > 0,
              createdAt: c.createdAt.toISOString(),
              userId: c.userId,
              profileId: c.profileId,
              authorId: c.profileId || c.userId || '1102',
              authorName: c.authorName || c.user?.name || c.profile?.username || '影迷',
              authorAvatar: c.authorAvatar || c.user?.avatar || c.profile?.avatar || '🎬',
              replies: c.replies.map((r) => ({
                id: r.id,
                content: r.content,
                authorName: r.authorName || r.user?.name || '影迷',
                authorAvatar: r.authorAvatar || r.user?.avatar || '🎬',
                authorId: r.userId || '1102',
                createdAt: r.createdAt.toISOString(),
              })),
            };

            return (
              <div
                key={c.id}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <Link
                    href={`/movie/${c.movie.doubanId}`}
                    style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    评价了《{c.movie.title}》({c.movie.year})
                  </Link>
                  <Link
                    href={`/review/${c.id}`}
                    style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}
                  >
                    查看详情 →
                  </Link>
                </div>
                <ShortReviewCard review={rev} isLoggedIn={Boolean(user)} />
              </div>
            );
          })}
      </div>
    </div>
  );
}
