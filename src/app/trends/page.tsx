import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { MovieCard } from '@/components/MovieCard';

export const dynamic = 'force-dynamic';

export default async function TrendsPage() {
  const [trends, topMovies, topSeries] = await Promise.all([
    prisma.searchTrend.findMany({
      orderBy: { count24h: 'desc' },
      take: 20,
    }),
    prisma.movie.findMany({
      where: { type: 'movie' },
      orderBy: [{ watchedCount: 'desc' }, { rating: 'desc' }],
      take: 6,
    }),
    prisma.movie.findMany({
      where: { type: 'tv' },
      orderBy: [{ watchedCount: 'desc' }, { rating: 'desc' }],
      take: 6,
    }),
  ]);

  return (
    <div className="trends-page">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', margin: '0 0 6px' }}>📈 全站热搜风向标</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          基于全站实时搜索量、播放频次与片友标记热度生成的影视风向榜
        </p>
      </div>

      {/* Real-time Search Ranking */}
      <section style={{ marginBottom: '32px' }}>
        <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
          🔥 实时热搜关键词 Top {trends.length}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '10px',
          }}
        >
          {trends.map((t, idx) => (
            <Link
              key={t.keyword}
              href={`/search?q=${encodeURIComponent(t.keyword)}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                color: 'var(--text)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: idx < 3 ? 'var(--accent-solid)' : 'var(--bg)',
                    color: idx < 3 ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ fontWeight: 500, fontSize: '14px' }}>{t.keyword}</span>
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>热度 {t.count24h}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Most Watched Movies */}
      <section style={{ marginBottom: '32px' }}>
        <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
          🎬 电影热度榜
        </h2>
        <div className="movie-grid">
          {topMovies.map((m, idx) => (
            <MovieCard
              key={m.doubanId}
              doubanId={m.doubanId}
              title={m.title}
              year={m.year}
              type={m.type}
              poster={m.poster}
              rating={m.rating}
              badge={`热榜 #${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Most Watched TV Series */}
      <section>
        <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
          📺 剧集追更榜
        </h2>
        <div className="movie-grid">
          {topSeries.map((m, idx) => (
            <MovieCard
              key={m.doubanId}
              doubanId={m.doubanId}
              title={m.title}
              year={m.year}
              type={m.type}
              poster={m.poster}
              rating={m.rating}
              badge={`追剧 #${idx + 1}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
