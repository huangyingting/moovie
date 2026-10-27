import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ShortReviewCard, type ReviewCommentView } from '@/components/MovieDetailInteractions';

export const dynamic = 'force-dynamic';

export default async function FollowingFeedPage() {
  const user = await getCurrentUser().catch(() => null);

  const follows = user
    ? await prisma.follow.findMany({
        where: { followerId: user.id },
      })
    : [];

  const followedIds = follows
    .map((f) => f.targetId)
    .filter((id): id is string => Boolean(id));

  const comments =
    followedIds.length > 0
      ? await prisma.comment.findMany({
          where: {
            OR: [
              { userId: { in: followedIds } },
              { profileId: { in: followedIds } },
            ],
          },
          include: {
            movie: true,
            user: true,
            profile: true,
            replies: {
              include: {
                user: true,
              },
            },
            likes: user ? { where: { userId: user.id } } : false,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

  return (
    <div className="following-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', margin: '0 0 4px' }}>👥 关注片友动态</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            实时追踪你关注的片友最新观影标记与短评
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/feed"
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            全站广场
          </Link>
          <Link
            href="/following"
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'var(--accent-solid)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            关注动态
          </Link>
        </div>
      </div>

      {!user ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: '17px', marginBottom: '8px' }}>请先登录查看关注动态</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            登录后可关注感兴趣的影迷，第一时间获取他们的观影片单与高分评价。
          </p>
          <Link
            href="/auth/login"
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              background: 'var(--accent-solid)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            立即登录
          </Link>
        </div>
      ) : comments.length === 0 ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: '17px', marginBottom: '8px' }}>你还没有关注任何片友，或他们暂无新动态</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            前往片友动态广场发现志同道合的观影伙伴吧！
          </p>
          <Link
            href="/feed"
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              background: 'var(--accent-solid)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            探索片友广场
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {comments.map((c) => {
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
                <div style={{ marginBottom: '8px' }}>
                  <Link
                    href={`/movie/${c.movie.doubanId}`}
                    style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    《{c.movie.title}》({c.movie.year})
                  </Link>
                </div>
                <ShortReviewCard review={rev} isLoggedIn={true} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
