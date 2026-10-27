import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  MovieActionButtons,
  BackdropsGallery,
  ShortReviewCard,
  type ReviewCommentView,
} from '@/components/MovieDetailInteractions';
import { MovieCard } from '@/components/MovieCard';

export const dynamic = 'force-dynamic';

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ doubanId: string }>;
}) {
  const { doubanId } = await params;
  const user = await getCurrentUser().catch(() => null);

  const movie = await prisma.movie.findUnique({
    where: { doubanId },
    include: {
      playbackSources: {
        include: {
          episodes: {
            orderBy: { episodeNumber: 'asc' },
          },
        },
        orderBy: { loadSpeedMs: 'asc' },
      },
      comments: {
        include: {
          user: true,
          profile: true,
          replies: {
            include: {
              user: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          likes: user ? { where: { userId: user.id } } : false,
        },
        orderBy: [{ likesCount: 'desc' }, { createdAt: 'desc' }],
      },
    },
  });

  if (!movie) {
    notFound();
  }

  const [userMark, similarMovies, relatedLists] = await Promise.all([
    user
      ? prisma.userMovie.findUnique({
          where: {
            userId_movieId: {
              userId: user.id,
              movieId: movie.id,
            },
          },
        })
      : Promise.resolve(null),
    prisma.movie.findMany({
      where: {
        doubanId: { not: movie.doubanId },
        type: movie.type,
      },
      orderBy: { rating: 'desc' },
      take: 6,
    }),
    prisma.curatedList.findMany({
      where: {
        items: {
          some: { movieId: movie.id },
        },
      },
      take: 3,
    }),
  ]);

  const mappedReviews: ReviewCommentView[] = movie.comments.map((c) => ({
    id: c.id,
    doubanId: c.doubanId,
    rating: c.rating,
    content: c.content,
    likesCount: c.likesCount,
    likedByMe: Array.isArray(c.likes) && c.likes.length > 0,
    createdAt: c.createdAt.toISOString(),
    userId: c.userId,
    profileId: c.profileId,
    authorId: c.profileId || c.userId || '1102',
    authorName: c.authorName || c.user?.name || c.profile?.username || '影迷',
    authorAvatar: c.authorAvatar || c.user?.avatar || c.profile?.avatar || '🎬',
    replies: c.replies.map((r) => ({
      id: r.id,
      content: r.content,
      authorName: r.authorName || r.user?.name || '影迷',
      authorAvatar: r.authorAvatar || r.user?.avatar || '🎬',
      authorId: r.userId || '1102',
      createdAt: r.createdAt.toISOString(),
    })),
  }));

  let doubanReviews: Array<{ author: string; rating: number; content: string; date: string }> = [];
  if (movie.doubanReviewsJson) {
    try {
      doubanReviews = JSON.parse(movie.doubanReviewsJson);
    } catch {
      doubanReviews = [];
    }
  }

  let backdropUrls: string[] = [];
  if (movie.backdropsJson) {
    try {
      const parsed = JSON.parse(movie.backdropsJson);
      if (Array.isArray(parsed)) backdropUrls = parsed.filter(Boolean);
    } catch {
      backdropUrls = [];
    }
  }
  if (backdropUrls.length === 0) {
    backdropUrls = [
      movie.poster,
      '/static/img/placeholder.svg#still-1',
      '/static/img/placeholder.svg#still-2',
      '/static/img/placeholder.svg#still-3',
    ];
  }

  const actorList = movie.actors
    ? movie.actors
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const castPreview = actorList.slice(0, 3).join(' / ');
  const castFull = actorList.join(' / ');

  return (
    <div className="movie-detail-page">
      {/* Movie Header Info Card */}
      <section
        className="movie-detail-header"
        style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: '24px',
          padding: '24px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <img
            src={movie.poster}
            alt={movie.title}
            style={{
              width: '180px',
              height: '256px',
              objectFit: 'cover',
              borderRadius: '10px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>{movie.title}</h1>
              {movie.originalTitle && (
                <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>{movie.originalTitle}</span>
              )}
              <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>({movie.year})</span>
              {movie.rating >= 8.5 && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: '#f5a623',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  豆瓣高分经典
                </span>
              )}
            </div>

            {movie.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#f5a623' }}>
                  ★ {movie.rating.toFixed(1)}
                </span>
                <div className="movie-ext-links" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                  <a
                    href={`https://movie.douban.com/subject/${movie.doubanId}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="ext-link ext-douban"
                    style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}
                  >
                    豆瓣 #{movie.doubanId} ↗
                  </a>
                  {movie.imdbId && (
                    <a
                      href={`https://www.imdb.com/title/${movie.imdbId}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="ext-link ext-imdb"
                      style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}
                    >
                      IMDb {movie.imdbId} ↗
                    </a>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              <div>
                <strong>导演：</strong>
                {movie.directors}
              </div>
              <div className="movie-cast">
                {actorList.length > 3 ? (
                  <details className="movie-cast-details">
                    <summary className="cast-toggle" style={{ cursor: 'pointer', listStyle: 'none' }}>
                      <strong>主演：</strong>
                      <span className="movie-cast-preview">{castPreview}</span>
                      <span
                        className="cast-more"
                        style={{ marginLeft: '8px', color: 'var(--accent)', fontSize: '12px' }}
                      >
                        展开全部 ({actorList.length})
                      </span>
                    </summary>
                    <div className="movie-cast-full" style={{ marginTop: '4px', color: 'var(--text)' }}>
                      {castFull}
                    </div>
                  </details>
                ) : (
                  <>
                    <strong>主演：</strong>
                    {movie.actors}
                  </>
                )}
              </div>
              <div>
                <strong>类型：</strong>
                {movie.genres} · <strong>地区：</strong>
                {movie.regions} · <strong>片长：</strong>
                {movie.duration}
              </div>
              {movie.airDate && (
                <div>
                  <strong>首映日期：</strong>
                  {movie.airDate}
                </div>
              )}
              {movie.nextAirDate && (
                <div style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  📅 更新日历：{movie.nextAirDate}
                </div>
              )}
            </div>

            <p style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--text)', margin: '0 0 16px' }}>
              {movie.summary}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
            <Link
              href={`/watch/${movie.doubanId}`}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                background: 'var(--accent-solid)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              ▶ 立即在线观看
            </Link>

            <MovieActionButtons
              doubanId={movie.doubanId}
              title={movie.title}
              initialStatus={userMark?.status}
              initialRating={userMark?.rating}
              initialComment={userMark?.comment}
              isLoggedIn={Boolean(user)}
              watchedCount={movie.watchedCount}
              wishCount={movie.wishCount}
            />
          </div>
        </div>
      </section>

      {/* Multi-Source Playback Links */}
      <section style={{ marginTop: '24px' }}>
        <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
          📡 聚合播放源 ({movie.playbackSources.length})
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '10px',
          }}
        >
          {movie.playbackSources.map((src) => (
            <Link
              key={src.id}
              href={`/watch/${movie.doubanId}?source=${src.sourceKey}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                color: 'var(--text)',
                fontSize: '13px',
              }}
            >
              <span>
                <strong>{src.sourceName}</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>({src.versionLabel})</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{(src.loadSpeedMs / 1000).toFixed(1)}s</span>
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background:
                      src.stability === '稳定'
                        ? 'var(--green-bg)'
                        : src.stability === '一般'
                          ? 'var(--yellow-bg)'
                          : 'var(--red-bg)',
                    color:
                      src.stability === '稳定'
                        ? 'var(--green)'
                        : src.stability === '一般'
                          ? 'var(--yellow)'
                          : 'var(--red)',
                    fontWeight: 600,
                  }}
                >
                  {src.stability}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Stills & Backdrops Lightbox Gallery */}
      <BackdropsGallery backdrops={backdropUrls} title={movie.title} />

      {/* Related Curated Lists */}
      {relatedLists.length > 0 && (
        <section style={{ marginTop: '24px' }}>
          <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '10px' }}>
            📚 收录本片的精选片单
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {relatedLists.map((lst) => (
              <Link
                key={lst.slug}
                href={`/list/${lst.slug}`}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  fontSize: '13px',
                }}
              >
                {lst.title} →
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Community Short Reviews */}
      <section style={{ marginTop: '28px' }}>
        <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
          💬 站内片友短评 ({mappedReviews.length})
        </h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {mappedReviews.map((rev) => (
            <ShortReviewCard key={rev.id} review={rev} isLoggedIn={Boolean(user)} />
          ))}
        </div>
      </section>

      {/* Douban Selected Reviews */}
      {doubanReviews.length > 0 && (
        <section style={{ marginTop: '28px' }}>
          <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
            🌱 豆瓣精选短评
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {doubanReviews.map((dr, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <strong>{dr.author}</strong>
                  <span style={{ color: '#f5a623' }}>{'★'.repeat(dr.rating || 5)}</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {dr.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Recommendations */}
      <section style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '17px', margin: 0 }}>
            🎯 相似影视推荐
          </h2>
          <Link href={`/similar/${movie.doubanId}`} style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
            更多相似作品 →
          </Link>
        </div>
        <div className="movie-grid">
          {similarMovies.map((m) => (
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
    </div>
  );
}
