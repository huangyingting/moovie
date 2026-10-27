import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MovieCard } from '@/components/MovieCard';

export const dynamic = 'force-dynamic';

const CATEGORY_MAP: Record<string, { title: string; subtitle: string; type?: string }> = {
  movie: { title: '🎬 电影频道', subtitle: '院线大片 · 高分冷门佳作 · 经典蓝光修复', type: 'movie' },
  tv: { title: '📺 电视剧频道', subtitle: '国产热剧 · 美剧 · 英剧 · 日韩剧集同步追更', type: 'tv' },
  show: { title: '🎤 综艺频道', subtitle: '人气真人秀 · 喜剧脱口秀 · 音乐竞演', type: 'show' },
  cartoon: { title: '🌸 动漫频道', subtitle: '新番连载 · 剧场版动画 · 国漫经典', type: 'cartoon' },
  top250: { title: '🏆 豆瓣电影 Top 250', subtitle: '影史口碑最高的不朽经典合集' },
};

export default async function DiscoverCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const meta = CATEGORY_MAP[category];
  if (!meta) {
    notFound();
  }

  const movies = await prisma.movie.findMany({
    where:
      category === 'top250'
        ? { rating: { gte: 8.5 } }
        : { type: meta.type },
    orderBy: { rating: 'desc' },
  });

  const navItems = [
    { slug: '', label: '全部频道', href: '/discover' },
    { slug: 'movie', label: '电影', href: '/discover/movie' },
    { slug: 'tv', label: '剧集', href: '/discover/tv' },
    { slug: 'show', label: '综艺', href: '/discover/show' },
    { slug: 'cartoon', label: '动漫', href: '/discover/cartoon' },
    { slug: 'top250', label: '豆瓣 Top250', href: '/discover/top250' },
  ];

  return (
    <div className="discover-category-page">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: '0 0 6px' }}>{meta.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 14px' }}>{meta.subtitle}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {navItems.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                background: c.slug === category ? 'var(--accent-solid)' : 'var(--bg-secondary)',
                color: c.slug === category ? '#fff' : 'var(--text)',
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
      </div>

      <div className="movie-grid">
        {movies.map((m, idx) => (
          <MovieCard
            key={m.doubanId}
            doubanId={m.doubanId}
            title={m.title}
            year={m.year}
            type={m.type}
            poster={m.poster}
            rating={m.rating}
            badge={category === 'top250' ? `Top #${idx + 1}` : m.episodeBadge || undefined}
          />
        ))}
      </div>
    </div>
  );
}
