import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CuratedListsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;
  const activeCat = sp.cat || '';

  const lists = await prisma.curatedList.findMany({
    include: {
      items: {
        include: { movie: true },
        orderBy: { rank: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const categories = ['精选主题'];
  const filteredLists = activeCat ? lists : lists;

  return (
    <div className="lists-page">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: '0 0 6px' }}>📚 主题精选片单</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 14px' }}>
          由编辑部与资深片友策展的高分主题片单，告别片荒
        </p>

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Link
            href="/list"
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: !activeCat ? 'var(--accent-solid)' : 'var(--bg-secondary)',
              color: !activeCat ? '#fff' : 'var(--text)',
              border: '1px solid var(--border)',
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            全部 ({lists.length})
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/list?cat=${encodeURIComponent(cat)}`}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                background: activeCat === cat ? 'var(--accent-solid)' : 'var(--bg-secondary)',
                color: activeCat === cat ? '#fff' : 'var(--text)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                fontSize: '13px',
              }}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '18px' }}>
        {filteredLists.map((lst) => (
          <div
            key={lst.slug}
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                    fontSize: '11px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  精选片单
                </span>
                <h2 style={{ fontSize: '18px', margin: '0 0 6px' }}>
                  <Link href={`/list/${lst.slug}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                    {lst.title}
                  </Link>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                  {lst.description}
                </p>
              </div>
              <Link
                href={`/list/${lst.slug}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                浏览完整片单 ({lst.items.length}) →
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
              {lst.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/movie/${item.movie.doubanId}`}
                  style={{
                    flex: '0 0 110px',
                    textDecoration: 'none',
                    color: 'var(--text)',
                  }}
                >
                  <img
                    src={item.movie.poster}
                    alt={item.movie.title}
                    style={{
                      width: '110px',
                      height: '156px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      marginBottom: '4px',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.movie.title}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
