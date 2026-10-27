import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { WatchPlayerClient } from '@/components/WatchPlayerClient';
import type { ReviewCommentView } from '@/components/MovieDetailInteractions';

export const dynamic = 'force-dynamic';

export default async function PlaySourceVodPage({
  params,
  searchParams,
}: {
  params: Promise<{ sourceKey: string; vodId: string }>;
  searchParams: Promise<{ ep?: string; title?: string; year?: string; type?: string }>;
}) {
  const { sourceKey, vodId } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser().catch(() => null);

  // Locate playback source or extract doubanId prefix
  const sourceRecord = await prisma.playbackSource.findFirst({
    where: {
      OR: [
        { sourceKey, vodId },
        { vodId },
      ],
    },
    include: {
      movie: true,
    },
  });

  const inferredDoubanId = sourceRecord?.movie.doubanId || vodId.split('-')[0];

  const movie = await prisma.movie.findUnique({
    where: { doubanId: inferredDoubanId },
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
          },
          likes: user ? { where: { userId: user.id } } : false,
        },
      },
    },
  });

  if (!movie) {
    notFound();
  }

  const [userMark, similarMovies] = await Promise.all([
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

  let parsedBackdrops: string[] = [];
  if (movie.backdropsJson) {
    try {
      const parsed = JSON.parse(movie.backdropsJson);
      if (Array.isArray(parsed)) parsedBackdrops = parsed.filter(Boolean);
    } catch {
      parsedBackdrops = [];
    }
  }
  if (parsedBackdrops.length === 0) {
    parsedBackdrops = [
      movie.poster,
      '/static/img/placeholder.svg#still-1',
      '/static/img/placeholder.svg#still-2',
      '/static/img/placeholder.svg#still-3',
    ];
  }

  let parsedDoubanReviews: Array<{
    id?: string;
    author: string;
    rating: number;
    content: string;
    createdAt?: string;
    date?: string;
    likes?: number;
  }> = [];
  if (movie.doubanReviewsJson) {
    try {
      parsedDoubanReviews = JSON.parse(movie.doubanReviewsJson);
    } catch {
      parsedDoubanReviews = [];
    }
  }

  return (
    <WatchPlayerClient
      movie={{
        id: movie.id,
        doubanId: movie.doubanId,
        imdbId: movie.imdbId,
        title: sp.title || movie.title,
        year: sp.year || movie.year,
        type: sp.type || movie.type,
        poster: movie.poster,
        rating: movie.rating,
        genres: movie.genres,
        regions: movie.regions,
        directors: movie.directors,
        actors: movie.actors,
        duration: movie.duration,
        summary: movie.summary,
        nextAirDate: movie.nextAirDate,
        watchedCount: movie.watchedCount,
        wishCount: movie.wishCount,
        backdrops: parsedBackdrops,
        doubanReviews: parsedDoubanReviews,
      }}
      sources={movie.playbackSources.map((s) => ({
        id: s.id,
        sourceKey: s.sourceKey,
        sourceName: s.sourceName,
        vodId: s.vodId,
        versionLabel: s.versionLabel,
        loadSpeedMs: s.loadSpeedMs,
        stability: s.stability,
        episodes: s.episodes.map((e) => ({
          id: e.id,
          episodeNumber: e.episodeNumber,
          title: e.title,
          playUrl: e.playUrl,
          airDate: e.airDate,
        })),
      }))}
      initialSourceKey={sourceKey}
      initialEpisodeNumber={sp.ep ? Number(sp.ep) : 1}
      initialUserStatus={userMark?.status}
      initialUserRating={userMark?.rating}
      initialUserComment={userMark?.comment}
      initialAdSkipEnabled={user?.adSkipEnabled}
      isLoggedIn={Boolean(user)}
      reviews={mappedReviews}
      similarMovies={similarMovies.map((m) => ({
        doubanId: m.doubanId,
        title: m.title,
        year: m.year,
        type: m.type,
        poster: m.poster,
        rating: m.rating,
      }))}
    />
  );
}
