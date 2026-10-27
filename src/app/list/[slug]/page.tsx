import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CuratedListDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const list = await prisma.curatedList.findUnique({
    where: { slug },
    include: {
      items: {
        include: { movie: true },
        orderBy: { rank: 'asc' },
      },
    },
  });

  if (!list) {
    notFound();
  }

  return (
    <div className="list-detail-page">
      <div style={{ marginBottom: '16px' }}>
        <Link href="/list" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
          ← 返回全部片单
        </Link>
      </div>

      <div
        style={{
          padding: '24px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          marginBottom: '24px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          精选主题 · 共 {list.items.length} 部作品
        </span>
        <h1 style={{ fontSize: '24px', margin: '0 0 8px' }}>{list.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
          {list.description}
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {list.items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr',
              gap: '16px',
              padding: '16px',
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <Link href={`/movie/${item.movie.doubanId}`}>
              <img
                src={item.movie.poster}
                alt={item.movie.title}
                style={{ width: '110px', height: '156px', objectFit: 'cover', borderRadius: '8px' }}
              />
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span
                    style={{
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'var(--accent-solid)',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <Link
                    href={`/movie/${item.movie.doubanId}`}
                    style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}
                  >
                    {item.movie.title}
                  </Link>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>({item.movie.year})</span>
                  {item.movie.rating > 0 && (
                    <span style={{ color: '#f5a623', fontSize: '13px', fontWeight: 600 }}>
                      ★ {item.movie.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {item.movie.regions} · {item.movie.genres} · 导演：{item.movie.directors}
                </div>
                {item.note && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg)',
                      fontSize: '13px',
                      color: 'var(--text)',
                      marginBottom: '8px',
                    }}
                  >
                    💡 策展推荐语：{item.note}
                  </div>
                )}
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                  {item.movie.summary}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <Link
                  href={`/watch/${item.movie.doubanId}`}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'var(--accent-solid)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  ▶ 立即观看
                </Link>
                <Link
                  href={`/movie/${item.movie.doubanId}`}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontSize: '13px',
                  }}
                >
                  影片详情
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
