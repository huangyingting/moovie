import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kw?: string; doubanId?: string; source?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp.q || sp.kw || sp.doubanId || '').trim();
  const activeSourceFilter = (sp.source || '').trim();
  const activeYearFilter = (sp.year || '').trim();

  // Log search keyword if non-empty
  if (query) {
    await prisma.searchTrend
      .upsert({
        where: { keyword: query },
        update: { count24h: { increment: 1 }, countAll: { increment: 1 } },
        create: { keyword: query, count24h: 1, countAll: 1 },
      })
      .catch(() => {});
  }

  const [movies, trends] = await Promise.all([
    query
      ? prisma.movie.findMany({
          where: {
            OR: [
              { title: { contains: query } },
              { originalTitle: { contains: query } },
              { directors: { contains: query } },
              { actors: { contains: query } },
              { genres: { contains: query } },
              { doubanId: { equals: query } },
            ],
          },
          include: {
            playbackSources: {
              include: {
                episodes: {
                  orderBy: { episodeNumber: 'asc' },
                },
              },
              orderBy: { loadSpeedMs: 'asc' },
            },
          },
          orderBy: { rating: 'desc' },
        })
      : Promise.resolve([]),
    prisma.searchTrend.findMany({
      orderBy: { count24h: 'desc' },
      take: 10,
    }),
  ]);

  // Flatten all provider results across matched movies for "播放源结果"
  const allProviderItems = movies.flatMap((m) =>
    m.playbackSources.map((src) => ({
      movie: m,
      source: src,
    }))
  );

  // Source counts for filter pills
  const sourceCounts = new Map<string, { name: string; count: number }>();
  for (const item of allProviderItems) {
    const prev = sourceCounts.get(item.source.sourceKey);
    if (prev) {
      prev.count += 1;
    } else {
      sourceCounts.set(item.source.sourceKey, {
        name: item.source.sourceName,
        count: 1,
      });
    }
  }

  const availableYears = Array.from(new Set(movies.map((m) => m.year))).sort((a, b) =>
    b.localeCompare(a)
  );

  const filteredProviderItems = allProviderItems.filter((item) => {
    if (activeSourceFilter && item.source.sourceKey !== activeSourceFilter) return false;
    if (activeYearFilter && item.movie.year !== activeYearFilter) return false;
    return true;
  });

  return (
    <div className="search-page">
      <div style={{ marginBottom: '20px' }}>
        <form action="/search" method="GET" className="search-form" style={{ maxWidth: '640px' }}>
          <div className="search-box">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="输入片名、导演、演员或豆瓣编号搜索..."
              className="search-input"
            />
            <button type="submit" className="search-btn">
              搜索
            </button>
          </div>
        </form>
      </div>

      {!query ? (
        <div>
          <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>🔥 热门搜索词</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {trends.map((t, idx) => (
              <Link
                key={t.keyword}
                href={`/search?q=${encodeURIComponent(t.keyword)}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: '13px',
                }}
              >
                <strong style={{ color: idx < 3 ? 'var(--accent)' : 'var(--text-muted)', marginRight: '6px' }}>
                  {idx + 1}
                </strong>
                {t.keyword}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            搜索 “<strong style={{ color: 'var(--text)' }}>{query}</strong>” 共收录{' '}
            <strong style={{ color: 'var(--accent)' }}>{movies.length}</strong> 部媒体库条目，匹配{' '}
            <strong style={{ color: 'var(--accent)' }}>{allProviderItems.length}</strong> 条直连播放源
          </div>

          {movies.length === 0 ? (
            <div
              style={{
                padding: '48px 20px',
                textAlign: 'center',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                暂未找到匹配的影视资源
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                请尝试更换关键词，或前往求片反馈提交片名与豆瓣链接。
              </p>
              <Link
                href={`/feedback?type=request`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: 'var(--accent-solid)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '13px',
                }}
              >
                提交求片反馈
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '28px' }}>
              {/* Section 1: 媒体库收录 (.library-section / .library-card) */}
              <section className="library-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>媒体库收录</h2>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(124, 58, 237, 0.12)',
                      color: '#7c3aed',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {movies.length}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '14px' }}>
                  {movies.map((m) => (
                    <div
                      key={m.doubanId}
                      className="library-card search-result-card"
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
                      <Link href={`/movie/${m.doubanId}`}>
                        <img
                          src={m.poster}
                          alt={m.title}
                          style={{
                            width: '110px',
                            height: '156px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />
                      </Link>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <Link
                              href={`/movie/${m.doubanId}`}
                              style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}
                            >
                              {m.title}
                            </Link>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>({m.year})</span>
                            {m.rating > 0 && (
                              <span style={{ color: '#f5a623', fontSize: '13px', fontWeight: 600 }}>
                                ★ {m.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            {m.regions} · {m.genres} · 导演：{m.directors} · 主演：{m.actors}
                          </div>
                          <p
                            style={{
                              fontSize: '13px',
                              color: 'var(--text-secondary)',
                              margin: '0 0 12px',
                              lineHeight: 1.55,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {m.summary}
                          </p>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '12px',
                                color: 'var(--green)',
                                background: 'var(--green-bg)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontWeight: 600,
                              }}
                            >
                              ✓ 已匹配 {m.playbackSources.length} 个播放源
                            </span>
                            {m.playbackSources.map((src) => (
                              <Link
                                key={src.id}
                                href={`/watch/${m.doubanId}?source=${src.sourceKey}`}
                                className="search-source-chip"
                                style={{
                                  padding: '4px 9px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border)',
                                  background: 'var(--bg)',
                                  color: 'var(--text)',
                                  textDecoration: 'none',
                                  fontSize: '12px',
                                }}
                              >
                                {src.sourceName} · {(src.loadSpeedMs / 1000).toFixed(1)}s ({src.stability})
                              </Link>
                            ))}
                          </div>

                          <Link
                            href={`/watch/${m.doubanId}`}
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
                            立即播放 →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 2: 播放源结果 (.source-results-section / .result-item) */}
              <section className="source-results-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>播放源结果</h2>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {filteredProviderItems.length}
                  </span>
                </div>

                {/* Filter Bar: Source Pills with Counts + Year Filter */}
                <div
                  className="search-filter-bar"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    className="source-filter-pills"
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>筛选：</span>
                    <Link
                      href={`/search?kw=${encodeURIComponent(query)}${activeYearFilter ? `&year=${encodeURIComponent(activeYearFilter)}` : ''}`}
                      className={`source-pill ${!activeSourceFilter ? 'active' : ''}`}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        textDecoration: 'none',
                        border: '1px solid var(--border)',
                        background: !activeSourceFilter ? 'var(--accent-solid)' : 'var(--bg)',
                        color: !activeSourceFilter ? '#fff' : 'var(--text)',
                      }}
                    >
                      全部 ({allProviderItems.length})
                    </Link>
                    {Array.from(sourceCounts.entries()).map(([sKey, info]) => (
                      <Link
                        key={sKey}
                        href={`/search?kw=${encodeURIComponent(query)}&source=${encodeURIComponent(sKey)}${activeYearFilter ? `&year=${encodeURIComponent(activeYearFilter)}` : ''}`}
                        className={`source-pill ${activeSourceFilter === sKey ? 'active' : ''}`}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          textDecoration: 'none',
                          border: '1px solid var(--border)',
                          background: activeSourceFilter === sKey ? 'var(--accent-solid)' : 'var(--bg)',
                          color: activeSourceFilter === sKey ? '#fff' : 'var(--text)',
                        }}
                      >
                        {info.name} ({info.count})
                      </Link>
                    ))}
                  </div>

                  {availableYears.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>年份：</span>
                      <Link
                        href={`/search?kw=${encodeURIComponent(query)}${activeSourceFilter ? `&source=${encodeURIComponent(activeSourceFilter)}` : ''}`}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          background: !activeYearFilter ? 'var(--accent-light)' : 'transparent',
                          color: !activeYearFilter ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: !activeYearFilter ? 600 : 400,
                        }}
                      >
                        全部
                      </Link>
                      {availableYears.map((yr) => (
                        <Link
                          key={yr}
                          href={`/search?kw=${encodeURIComponent(query)}${activeSourceFilter ? `&source=${encodeURIComponent(activeSourceFilter)}` : ''}&year=${encodeURIComponent(yr)}`}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            background: activeYearFilter === yr ? 'var(--accent-light)' : 'transparent',
                            color: activeYearFilter === yr ? 'var(--accent)' : 'var(--text-secondary)',
                            fontWeight: activeYearFilter === yr ? 600 : 400,
                          }}
                        >
                          {yr}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Provider Result Rows (.result-item) */}
                <div className="result-list" style={{ display: 'grid', gap: '10px' }}>
                  {filteredProviderItems.map(({ movie: m, source: src }) => (
                    <div
                      key={src.id}
                      className="result-item"
                      data-source={src.sourceKey}
                      data-year={m.year}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <Link
                            href={`/play/${src.sourceKey}/${src.vodId}?title=${encodeURIComponent(m.title)}&year=${encodeURIComponent(m.year)}&type=${encodeURIComponent(m.type)}`}
                            style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', textDecoration: 'none' }}
                          >
                            {m.title}
                          </Link>
                          <span
                            className="result-source-badge"
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {src.sourceName}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.year}</span>
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
                            {src.episodes.length > 1 ? `全${src.episodes.length}集` : src.versionLabel || '正片'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span>{m.regions} · {m.genres}</span>
                          <span>· 延迟 {(src.loadSpeedMs / 1000).toFixed(1)}s</span>
                          <span
                            style={{
                              color:
                                src.stability === '稳定'
                                  ? 'var(--green)'
                                  : src.stability === '一般'
                                    ? 'var(--yellow)'
                                    : 'var(--red)',
                              fontWeight: 600,
                            }}
                          >
                            ● {src.stability}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link
                          href={`/play/${src.sourceKey}/${src.vodId}?title=${encodeURIComponent(m.title)}&year=${encodeURIComponent(m.year)}&type=${encodeURIComponent(m.type)}`}
                          className="btn-play-result"
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
                          ▶ 播放
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
