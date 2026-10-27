import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { MovieCard } from '@/components/MovieCard';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; region?: string; year?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const genre = sp.genre || '';
  const region = sp.region || '';
  const year = sp.year || '';
  const sort = sp.sort || 'rating';

  const allMovies = await prisma.movie.findMany({
    orderBy: sort === 'year' ? { year: 'desc' } : { rating: 'desc' },
  });

  const filtered = allMovies.filter((m) => {
    if (genre && !m.genres.includes(genre)) return false;
    if (region && !m.regions.includes(region)) return false;
    if (year && m.year !== year) return false;
    return true;
  });

  const top250 = allMovies
    .filter((m) => m.rating >= 8.5)
    .sort((a, b) => b.rating - a.rating);

  const categories = [
    { slug: '', label: '全部频道', href: '/discover' },
    { slug: 'movie', label: '电影', href: '/discover/movie' },
    { slug: 'tv', label: '剧集', href: '/discover/tv' },
    { slug: 'show', label: '综艺', href: '/discover/show' },
    { slug: 'cartoon', label: '动漫', href: '/discover/cartoon' },
    { slug: 'top250', label: '豆瓣 Top250', href: '/discover/top250' },
  ];

  const genres = ['剧情', '科幻', '动作', '悬疑', '犯罪', '动画', '喜剧', '历史', '真人秀'];
  const regions = ['中国大陆', '美国', '英国', '日本', '韩国', '中国香港', '法国'];

  return (
    <div className="discover-page">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: '0 0 12px' }}>🧭 分类找片</h1>

        {/* Channel Sub-navigation */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                background: c.slug === '' ? 'var(--accent-solid)' : 'var(--bg-secondary)',
                color: c.slug === '' ? '#fff' : 'var(--text)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {/* Genre & Region Filters */}
        <div
          style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            display: 'grid',
            gap: '10px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>类型：</span>
            <Link
              href={`/discover${region ? `?region=${encodeURIComponent(region)}` : ''}`}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: !genre ? 'var(--accent-light)' : 'transparent',
                color: !genre ? 'var(--accent)' : 'var(--text)',
                textDecoration: 'none',
              }}
            >
              全部
            </Link>
            {genres.map((g) => (
              <Link
                key={g}
                href={`/discover?genre=${encodeURIComponent(g)}${region ? `&region=${encodeURIComponent(region)}` : ''}`}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: genre === g ? 'var(--accent-light)' : 'transparent',
                  color: genre === g ? 'var(--accent)' : 'var(--text)',
                  textDecoration: 'none',
                }}
              >
                {g}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>地区：</span>
            <Link
              href={`/discover${genre ? `?genre=${encodeURIComponent(genre)}` : ''}`}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: !region ? 'var(--accent-light)' : 'transparent',
                color: !region ? 'var(--accent)' : 'var(--text)',
                textDecoration: 'none',
              }}
            >
              全部
            </Link>
            {regions.map((r) => (
              <Link
                key={r}
                href={`/discover?region=${encodeURIComponent(r)}${genre ? `&genre=${encodeURIComponent(genre)}` : ''}`}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: region === r ? 'var(--accent-light)' : 'transparent',
                  color: region === r ? 'var(--accent)' : 'var(--text)',
                  textDecoration: 'none',
                }}
              >
                {r}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Filtered Catalog Grid */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '17px', margin: 0 }}>
            片库筛选结果 ({filtered.length})
          </h2>
        </div>
        <div className="movie-grid">
          {filtered.map((m) => (
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

      {/* Douban Top 250 Preview */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '17px', margin: 0 }}>
            🏆 豆瓣电影 Top 250 必看经典
          </h2>
          <Link href="/discover/top250" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
            完整榜单 →
          </Link>
        </div>
        <div className="movie-grid">
          {top250.map((m, idx) => (
            <MovieCard
              key={m.doubanId}
              doubanId={m.doubanId}
              title={m.title}
              year={m.year}
              type={m.type}
              poster={m.poster}
              rating={m.rating}
              badge={`No.${idx + 1}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
