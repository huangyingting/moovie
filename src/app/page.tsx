import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { HomeSearchClient } from '@/components/HomeSearchClient';
import { MovieCard } from '@/components/MovieCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null);

  const [trends, allMovies, lists, featuredReviews, serverHistory] = await Promise.all([
    prisma.searchTrend.findMany({
      orderBy: { count24h: 'desc' },
      take: 10,
    }),
    prisma.movie.findMany({
      orderBy: [{ isHot: 'desc' }, { rating: 'desc' }],
    }),
    prisma.curatedList.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 3,
      include: {
        items: {
          include: { movie: true },
          orderBy: { rank: 'asc' },
          take: 4,
        },
      },
    }),
    prisma.comment.findMany({
      where: { isFeatured: true },
      orderBy: [{ likesCount: 'desc' }, { createdAt: 'desc' }],
      take: 4,
      include: {
        movie: true,
        profile: true,
        user: true,
      },
    }),
    user
      ? prisma.watchHistory.findMany({
          where: { userId: user.id },
          include: { movie: true },
          orderBy: { updatedAt: 'desc' },
          take: 6,
        })
      : Promise.resolve([]),
  ]);

  const hotMovies = allMovies.filter((m) => m.type === 'movie');
  const hotSeries = allMovies.filter((m) => m.type === 'tv');
  const hotShows = allMovies.filter((m) => m.type === 'show');
  const hotCartoons = allMovies.filter((m) => m.type === 'cartoon');
  const nowPlaying = allMovies.filter((m) => m.isNew || m.year >= '2024');

  const mappedHistory = serverHistory.map((h) => ({
    id: h.id,
    douban_id: h.movie.doubanId,
    title: h.movie.title,
    poster: h.movie.poster,
    year: h.movie.year,
    type: h.movie.type,
    episode_number: h.episodeNumber,
    episode_title: h.episodeTitle,
    source_key: h.sourceKey,
    vod_id: h.vodId,
    current_time: h.currentTime,
    duration: h.duration,
  }));

  return (
    <div className="home-page">
      {/* Hero & Search Section */}
      <section className="hero-section" style={{ textAlign: 'center', padding: '28px 0 18px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <img
            src="/static/img/logo.png"
            alt="Moovie 影牛"
            style={{ width: '42px', height: '42px', borderRadius: '10px' }}
          />
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Moovie <span style={{ fontWeight: 500, fontSize: '18px', color: 'var(--text-secondary)' }}>影牛</span>
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px' }}>
          多源聚合搜索 · 极速在线播放 · 豆瓣片单同步与影迷互动社区
        </p>

        <HomeSearchClient
          hotTrends={trends.map((t) => ({ keyword: t.keyword, count: t.count24h }))}
          serverHistory={mappedHistory}
        />
      </section>

      {/* Personalized ForYou Banner (v3.4.0) */}
      <section style={{ marginTop: '28px' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '18px', margin: 0 }}>
            ✨ 为你推荐
          </h2>
          <Link href="/foryou" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
            更多个性推荐 →
          </Link>
        </div>
        <div className="movie-grid">
          {allMovies.slice(0, 6).map((m) => (
            <MovieCard
              key={m.doubanId}
              doubanId={m.doubanId}
              title={m.title}
              year={m.year}
              type={m.type}
              poster={m.poster}
              rating={m.rating}
              badge={m.episodeBadge || (m.rating >= 9.0 ? '豆瓣高分' : undefined)}
            />
          ))}
        </div>
      </section>

      {/* Now Playing in Cinema Strip (v4.1.2) */}
      {nowPlaying.length > 0 && (
        <section style={{ marginTop: '32px' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 className="section-title" style={{ fontSize: '18px', margin: 0 }}>
              🎟️ 院线正在热映
            </h2>
            <Link href="/cinema" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
              全部院线排片 →
            </Link>
          </div>
          <div className="movie-grid">
            {nowPlaying.map((m) => (
              <MovieCard
                key={m.doubanId}
                doubanId={m.doubanId}
                title={m.title}
                year={m.year}
                type={m.type}
                poster={m.poster}
                rating={m.rating}
                badge="热映中"
              />
            ))}
          </div>
        </section>
      )}

      {/* Hot Movies */}
      <section style={{ marginTop: '32px' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '18px', margin: 0 }}>
            🎬 热门电影
          </h2>
          <Link href="/discover/movie" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
            查看全部 →
          </Link>
        </div>
        <div className="movie-grid">
          {hotMovies.map((m) => (
            <MovieCard
              key={m.doubanId}
              doubanId={m.doubanId}
              title={m.title}
              year={m.year}
              type={m.type}
              poster={m.poster}
              rating={m.rating}
              badge={m.episodeBadge || undefined}
            />
          ))}
        </div>
      </section>

      {/* Hot TV Series */}
      <section style={{ marginTop: '32px' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '18px', margin: 0 }}>
            📺 热门剧集
          </h2>
          <Link href="/discover/tv" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
            查看全部 →
          </Link>
        </div>
        <div className="movie-grid">
          {hotSeries.map((m) => (
            <MovieCard
              key={m.doubanId}
              doubanId={m.doubanId}
              title={m.title}
              year={m.year}
              type={m.type}
              poster={m.poster}
              rating={m.rating}
              subtitle={m.episodeCount > 1 ? `全${m.episodeCount}集` : undefined}
            />
          ))}
        </div>
      </section>

      {/* Hot Variety Shows & Anime */}
      <section style={{ marginTop: '32px' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '18px', margin: 0 }}>
            🎭 热门综艺与动漫
          </h2>
          <div style={{ display: 'flex', gap: '14px' }}>
            <Link href="/discover/show" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
              综艺频道 →
            </Link>
            <Link href="/discover/cartoon" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
              动漫频道 →
            </Link>
          </div>
        </div>
        <div className="movie-grid">
          {[...hotShows, ...hotCartoons].map((m) => (
            <MovieCard
              key={m.doubanId}
              doubanId={m.doubanId}
              title={m.title}
              year={m.year}
              type={m.type}
              poster={m.poster}
              rating={m.rating}
            />
          ))}
        </div>
      </section>

      {/* Curated Lists Strip */}
      <section style={{ marginTop: '36px' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '18px', margin: 0 }}>
            📚 精选片单
          </h2>
          <Link href="/list" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
            全部片单 →
          </Link>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px',
          }}
        >
          {lists.map((lst) => (
            <Link
              key={lst.slug}
              href={`/list/${lst.slug}`}
              style={{
                display: 'block',
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                color: 'var(--text)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, marginBottom: '4px' }}>
                精选主题片单
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{lst.title}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                {lst.description}
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                收录 {lst.items.length} 部佳作 · 点击浏览
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Community Short Reviews */}
      <section style={{ marginTop: '36px' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '18px', margin: 0 }}>
            💬 站内片友热评
          </h2>
          <Link href="/feed" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
            片友动态广场 →
          </Link>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '14px',
          }}
        >
          {featuredReviews.map((rev) => {
            const authorName = rev.authorName || rev.user?.name || rev.profile?.username || '影迷';
            const authorId = rev.profileId || rev.userId || '1102';
            return (
              <div
                key={rev.id}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Link
                      href={`/movie/${rev.movie.doubanId}`}
                      style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      《{rev.movie.title}》
                    </Link>
                    <span style={{ color: '#f5a623', fontSize: '12px' }}>
                      {'★'.repeat(rev.rating)}
                    </span>
                  </div>
                  <Link
                    href={`/review/${rev.id}`}
                    style={{
                      display: 'block',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      marginBottom: '12px',
                    }}
                  >
                    “{rev.content}”
                  </Link>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <Link href={`/user/${authorId}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    @{authorName}
                  </Link>
                  <span>👍 {rev.likesCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
