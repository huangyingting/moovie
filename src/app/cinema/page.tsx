import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CinemaPage() {
  const [nowPlaying, allMovies, recentComments] = await Promise.all([
    prisma.movie.findMany({
      where: { isNew: true },
      orderBy: { rating: 'desc' },
      include: { playbackSources: true },
    }),
    prisma.movie.findMany({
      where: { type: 'movie' },
      orderBy: [{ watchedCount: 'desc' }, { rating: 'desc' }],
      take: 8,
      include: { playbackSources: true },
    }),
    prisma.comment.findMany({
      include: {
        movie: true,
        user: true,
        profile: true,
      },
      orderBy: [{ likesCount: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    }),
  ]);

  const displayMovies = nowPlaying.length > 0 ? nowPlaying : allMovies;
  const heroMovie = allMovies[0] || displayMovies[0];
  const sideMovies = allMovies.slice(1, 4);

  return (
    <div className="cinema-page">
      {/* Editorial Screening Room Header (matching 06-cinema.png) */}
      <header
        style={{
          borderTop: '2px solid var(--text)',
          borderBottom: '1px solid var(--border)',
          padding: '24px 0 20px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--accent)',
              letterSpacing: '0.08em',
              marginBottom: '6px',
            }}
          >
            MOOVIE 片友共同放映
          </div>
          <h1
            style={{
              fontSize: '42px',
              fontWeight: 900,
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            片场
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
            从一条短评，遇见下一部电影。
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>本周放映期</div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'serif' }}>10.26—11.01</div>
        </div>
      </header>

      {/* Section 01: 本周放映单 (Bento Screening Grid) */}
      {heroMovie && (
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              01
            </span>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>本周放映单</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                这一周，片友真正看过的电影。
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              overflow: 'hidden',
            }}
          >
            {/* Left Featured Screening Card */}
            <div
              style={{
                padding: '28px',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                gap: '24px',
              }}
            >
              <Link href={`/watch/${heroMovie.doubanId}`}>
                <img
                  src={heroMovie.poster}
                  alt={heroMovie.title}
                  style={{
                    width: '200px',
                    height: '286px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
                  }}
                />
              </Link>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, marginBottom: '8px' }}>
                  {Math.max(1, heroMovie.watchedCount)} 位片友看过
                </div>
                <Link
                  href={`/watch/${heroMovie.doubanId}`}
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: 'var(--text)',
                    textDecoration: 'none',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  {heroMovie.title}
                </Link>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {heroMovie.year}{' '}
                  {heroMovie.rating > 0 && (
                    <span style={{ color: '#f5a623', fontWeight: 700, marginLeft: '8px' }}>
                      ★ {heroMovie.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 16px' }}>
                  {heroMovie.summary}
                </p>
                <Link
                  href={`/watch/${heroMovie.doubanId}`}
                  style={{
                    display: 'inline-block',
                    padding: '7px 16px',
                    borderRadius: '6px',
                    background: 'var(--accent-solid)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  ▶ 进入放映室
                </Link>
              </div>
            </div>

            {/* Right Stacked Screening Cards */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sideMovies.map((sm, idx) => (
                <Link
                  key={sm.doubanId}
                  href={`/watch/${sm.doubanId}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '18px',
                    borderBottom: idx < sideMovies.length - 1 ? '1px solid var(--border)' : 'none',
                    textDecoration: 'none',
                    color: 'var(--text)',
                    flex: 1,
                  }}
                >
                  <img
                    src={sm.poster}
                    alt={sm.title}
                    style={{ width: '72px', height: '104px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>
                      {Math.max(1, sm.watchedCount)} 位片友看过
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{sm.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {sm.year}{' '}
                      {sm.rating > 0 && (
                        <span style={{ color: '#f5a623', fontWeight: 600, marginLeft: '6px' }}>
                          ★ {sm.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 02: 从一条短评，遇见下一部电影 */}
      {recentComments.length > 0 && (
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              02
            </span>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>片友共鸣现场</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                摘自近期片友留下的高赞短评。
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {recentComments.map((c) => {
              const authorName = c.authorName || c.user?.name || c.profile?.username || '影迷';
              const authorId = c.profileId || c.userId || '1102';
              return (
                <div
                  key={c.id}
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Link
                        href={`/user/${authorId}`}
                        style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)', textDecoration: 'none' }}
                      >
                        {c.authorAvatar || '🎬'} {authorName}
                      </Link>
                      <span style={{ color: '#f5a623', fontSize: '12px' }}>{'★'.repeat(c.rating)}</span>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: 1.65, margin: 0, color: 'var(--text)' }}>
                      “{c.content}”
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '12px' }}>
                    <Link
                      href={`/watch/${c.movie.doubanId}`}
                      style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      《{c.movie.title}》({c.movie.year})
                    </Link>
                    <Link
                      href={`/review/${c.id}`}
                      style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                    >
                      👍 {c.likesCount} · 短评详情 →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 03: 院线与流媒体排片单 (.cinema-card) */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            03
          </span>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>院线热映与流媒体片单</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              同步豆瓣院线排片表与流媒体上线状态 · 支持一键直达高清播放源
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {displayMovies.map((m) => (
            <div
              key={m.doubanId}
              className="cinema-card"
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '18px',
                padding: '18px',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <Link href={`/movie/${m.doubanId}`}>
                <img
                  src={m.poster}
                  alt={m.title}
                  style={{ width: '120px', height: '170px', objectFit: 'cover', borderRadius: '8px' }}
                />
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: m.isNew ? 'var(--green-bg)' : 'var(--accent-light)',
                        color: m.isNew ? 'var(--green)' : 'var(--accent)',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {m.isNew ? '院线热映中' : '流媒体热播'}
                    </span>
                    <Link
                      href={`/movie/${m.doubanId}`}
                      style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}
                    >
                      {m.title}
                    </Link>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>({m.year})</span>
                    {m.rating > 0 && (
                      <span style={{ color: '#f5a623', fontSize: '14px', fontWeight: 700 }}>
                        ★ {m.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {m.regions} · {m.genres} · {m.duration} · 导演：{m.directors} · 主演：{m.actors}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    {m.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                  <Link
                    href={`/watch/${m.doubanId}`}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '6px',
                      background: 'var(--accent-solid)',
                      color: '#fff',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    ▶ 在线观看 ({m.playbackSources.length} 个片源)
                  </Link>
                  <Link
                    href={`/movie/${m.doubanId}`}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      fontSize: '13px',
                    }}
                  >
                    详情与短评
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
