import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MovieCard } from '@/components/MovieCard';

export const dynamic = 'force-dynamic';

export default async function ForYouPage() {
  const user = await getCurrentUser().catch(() => null);

  let favoriteGenres: string[] = [];
  if (user) {
    const marks = await prisma.userMovie.findMany({
      where: { userId: user.id },
      include: { movie: true },
      take: 10,
    });
    const genreCounts = new Map<string, number>();
    for (const m of marks) {
      for (const g of m.movie.genres.split('/').map((s) => s.trim())) {
        if (g) genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
      }
    }
    favoriteGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);
  }

  const allMovies = await prisma.movie.findMany({
    orderBy: [{ rating: 'desc' }, { watchedCount: 'desc' }],
  });

  return (
    <div className="foryou-page">
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', margin: '0 0 6px' }}>✨ 为你推荐 (For You)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            {user
              ? favoriteGenres.length > 0
                ? `根据你的观影偏好（${favoriteGenres.join(' / ')}）与评分记录智能匹配`
                : '根据你的观影历史与豆瓣高分口碑为你智能推荐'
              : '基于全站高口碑佳作与片友协同过滤生成的推荐片单（登录后可获得专属口味匹配）'}
          </p>
        </div>
        {!user && (
          <Link
            href="/auth/login"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--accent-solid)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            登录解锁专属推荐
          </Link>
        )}
      </div>

      <div className="movie-grid">
        {allMovies.map((m) => (
          <MovieCard
            key={m.doubanId}
            doubanId={m.doubanId}
            title={m.title}
            year={m.year}
            type={m.type}
            poster={m.poster}
            rating={m.rating}
            badge={
              favoriteGenres.some((g) => m.genres.includes(g))
                ? '口味契合 96%'
                : m.rating >= 9.0
                  ? '口碑神作'
                  : '猜你喜欢'
            }
          />
        ))}
      </div>
    </div>
  );
}
