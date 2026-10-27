import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MovieCard } from '@/components/MovieCard';

export const dynamic = 'force-dynamic';

export default async function SimilarMoviesPage({
  params,
}: {
  params: Promise<{ doubanId: string }>;
}) {
  const { doubanId } = await params;

  const target = await prisma.movie.findUnique({
    where: { doubanId },
  });

  if (!target) {
    notFound();
  }

  const allOthers = await prisma.movie.findMany({
    where: { doubanId: { not: doubanId } },
    orderBy: { rating: 'desc' },
  });

  return (
    <div className="similar-page">
      <div style={{ marginBottom: '16px' }}>
        <Link href={`/movie/${target.doubanId}`} style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
          ← 返回《{target.title}》详情页
        </Link>
      </div>

      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ fontSize: '22px', margin: '0 0 6px' }}>
          🎯 与《{target.title}》相似的影视作品
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          基于类型标签（{target.genres}）、导演风格与片友共同标记记录计算的相似推荐
        </p>
      </div>

      <div className="movie-grid">
        {allOthers.map((m) => (
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
    </div>
  );
}
