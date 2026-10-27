import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  FollowUserButton,
  ShareProfileButton,
  ShortReviewCard,
  type ReviewCommentView,
} from '@/components/MovieDetailInteractions';
import { MovieCard } from '@/components/MovieCard';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const activeTab = sp.tab || 'all';
  const currentUser = await getCurrentUser().catch(() => null);

  const [dbUser, cinephile, followRecord, followersCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        userMovies: {
          include: { movie: true },
          orderBy: { updatedAt: 'desc' },
        },
        comments: {
          include: {
            movie: true,
            user: true,
            replies: {
              include: { user: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.cinephileProfile.findUnique({
      where: { id },
      include: {
        comments: {
          include: {
            movie: true,
            profile: true,
            replies: {
              include: { user: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    currentUser
      ? prisma.follow.findFirst({
          where: {
            followerId: currentUser.id,
            targetId: id,
          },
        })
      : Promise.resolve(null),
    prisma.follow.count({
      where: { targetId: id },
    }),
  ]);

  if (!dbUser && !cinephile) {
    notFound();
  }

  const isFollowing = Boolean(followRecord);
  const profileName = dbUser?.name || cinephile?.username || '影迷';
  const profileAvatar = dbUser?.avatar || cinephile?.avatar || '🎬';
  const profileBio = cinephile?.bio || '热爱光影与故事的影迷。';
  const isPublic = dbUser ? dbUser.isPublic : true;
  const isOwner = currentUser?.id === dbUser?.id;
  const totalFollowers = followersCount + (cinephile ? 2 : 0);

  const watchedMarks = dbUser?.userMovies.filter((m) => m.status === 'watched') || [];
  const wishMarks = dbUser?.userMovies.filter((m) => m.status === 'wish') || [];
  const rawComments = dbUser?.comments || cinephile?.comments || [];

  // Group watched marks + comments by YYYY-MM for 月记 (Monthly Journal)
  const monthlyBuckets = new Map<string, number>();
  for (const wm of watchedMarks) {
    const key = wm.updatedAt.toISOString().slice(0, 7);
    monthlyBuckets.set(key, (monthlyBuckets.get(key) || 0) + 1);
  }
  for (const c of rawComments) {
    const key = c.createdAt.toISOString().slice(0, 7);
    monthlyBuckets.set(key, (monthlyBuckets.get(key) || 0) + 1);
  }

  return (
    <div className="user-profile-page">
      {/* Profile Header matching 23-user-profile-1.png */}
      <section
        style={{
          padding: '24px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
            }}
          >
            {profileAvatar.length <= 2 ? profileAvatar : profileName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', margin: 0 }}>{profileName}</h1>
              {cinephile && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  认证片友
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '6px 0' }}>
              {profileBio}
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>想看 {dbUser ? wishMarks.length : cinephile?.wishCount || 0} 部</span>
              <span>已看 {dbUser ? watchedMarks.length : cinephile?.watchedCount || 0} 部</span>
              <span>月记 {monthlyBuckets.size} 篇</span>
              <span>短评 {rawComments.length} 条</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isOwner && (
            <FollowUserButton
              targetUserId={id}
              initialFollowing={isFollowing}
              initialFollowersCount={totalFollowers}
              isLoggedIn={Boolean(currentUser)}
            />
          )}
          <ShareProfileButton userId={id} label="分享" />
        </div>
      </section>

      {/* Profile Navigation Tabs (想看 / 已看 / 月记 / 短评) */}
      <div
        className="profile-tabs"
        style={{
          display: 'flex',
          gap: '20px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '24px',
          paddingBottom: '10px',
          fontSize: '14px',
        }}
      >
        <Link
          href={`/user/${id}`}
          style={{
            color: activeTab === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'all' ? 700 : 500,
            textDecoration: 'none',
          }}
        >
          全部动态
        </Link>
        <Link
          href={`/user/${id}?tab=wish`}
          style={{
            color: activeTab === 'wish' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'wish' ? 700 : 500,
            textDecoration: 'none',
          }}
        >
          ♡ 想看 {dbUser ? wishMarks.length : cinephile?.wishCount || 0}
        </Link>
        <Link
          href={`/user/${id}?tab=watched`}
          style={{
            color: activeTab === 'watched' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'watched' ? 700 : 500,
            textDecoration: 'none',
          }}
        >
          ✓ 已看 {dbUser ? watchedMarks.length : cinephile?.watchedCount || 0}
        </Link>
        <Link
          href={`/user/${id}?tab=journal`}
          style={{
            color: activeTab === 'journal' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'journal' ? 700 : 500,
            textDecoration: 'none',
          }}
        >
          📅 月记 {monthlyBuckets.size}
        </Link>
      </div>

      {!isPublic && !isOwner ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          🔒 该用户已将观影主页设为私密
        </div>
      ) : (
        <>
          {/* Monthly Journal View (月记) */}
          {(activeTab === 'journal' || activeTab === 'all') && monthlyBuckets.size > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
                📅 观影月记 ({monthlyBuckets.size})
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {Array.from(monthlyBuckets.entries()).map(([month, count]) => (
                  <div
                    key={month}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                    }}
                  >
                    <strong>{month}</strong> · 记录了 <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{count}</span> 部作品
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Watched Movies Grid */}
          {(activeTab === 'all' || activeTab === 'watched') && watchedMarks.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
                ✅ 看过的影视 ({watchedMarks.length})
              </h2>
              <div className="movie-grid">
                {watchedMarks.map((um) => (
                  <MovieCard
                    key={um.id}
                    doubanId={um.movie.doubanId}
                    title={um.movie.title}
                    year={um.movie.year}
                    type={um.movie.type}
                    poster={um.movie.poster}
                    rating={um.movie.rating}
                    badge={um.rating ? `我的评分 ★${um.rating}` : '已看'}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Wish List Grid */}
          {(activeTab === 'all' || activeTab === 'wish') && wishMarks.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
                ❤️ 想看的影视 ({wishMarks.length})
              </h2>
              <div className="movie-grid">
                {wishMarks.map((um) => (
                  <MovieCard
                    key={um.id}
                    doubanId={um.movie.doubanId}
                    title={um.movie.title}
                    year={um.movie.year}
                    type={um.movie.type}
                    poster={um.movie.poster}
                    rating={um.movie.rating}
                    badge="想看"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Published Reviews */}
          <section>
            <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
              💬 发表的短评 ({rawComments.length})
            </h2>
            {rawComments.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>暂无公开短评</div>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {rawComments.map((c) => {
                  const rev: ReviewCommentView = {
                    id: c.id,
                    doubanId: c.doubanId,
                    rating: c.rating,
                    content: c.content,
                    likesCount: c.likesCount,
                    createdAt: c.createdAt.toISOString(),
                    authorId: id,
                    authorName: profileName,
                    replies: c.replies.map((r) => ({
                      id: r.id,
                      content: r.content,
                      authorName: r.authorName || r.user?.name || '影迷',
                      authorId: r.userId || '1102',
                      createdAt: r.createdAt.toISOString(),
                    })),
                  };
                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <Link
                          href={`/movie/${c.movie.doubanId}`}
                          style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)', textDecoration: 'none' }}
                        >
                          《{c.movie.title}》({c.movie.year})
                        </Link>
                      </div>
                      <ShortReviewCard review={rev} isLoggedIn={Boolean(currentUser)} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
