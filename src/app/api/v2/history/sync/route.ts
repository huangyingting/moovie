import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  const sensitiveFilters = await prisma.contentFilter.findMany({
    where: { isSensitive: true },
  });
  const sensitiveKeywords = sensitiveFilters.map((f) => f.keyword.toLowerCase());

  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const histories = await prisma.watchHistory.findMany({
    where: { userId: user.id },
    include: { movie: true },
    orderBy: { updatedAt: 'desc' },
    take: 12,
  });

  return NextResponse.json({
    items: histories.map((h) => {
      const hay = `${h.movie.title} ${h.movie.genres}`.toLowerCase();
      const isSensitive = sensitiveKeywords.some((kw) => kw && hay.includes(kw));
      return {
        id: h.id,
        douban_id: h.doubanId,
        title: h.movie.title,
        poster: h.movie.poster,
        year: h.movie.year,
        type: h.movie.type,
        episode_number: h.episodeNumber,
        episode_title: h.episodeTitle,
        source_key: h.sourceKey,
        vod_id: h.vodId,
        current_time: h.currentTime,
        duration: h.duration,
        progress_percent: h.duration > 0 ? Math.min(100, Math.round((h.currentTime / h.duration) * 100)) : 0,
        is_sensitive: isSensitive,
        updated_at: h.updatedAt,
      };
    }),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({
      ok: true,
      synced: 0,
      cursor: Date.now(),
      changes: [],
      conflicts: [],
      requires_full_sync: false,
    });
  }

  try {
    const body = await request.json();
    const rawItems = Array.isArray(body?.operations)
      ? body.operations
      : Array.isArray(body?.items)
        ? body.items
        : body?.douban_id || body?.doubanId || body?.media_id
          ? [body]
          : [];

    let synced = 0;
    const changes: Array<Record<string, unknown>> = [];

    for (const item of rawItems) {
      const opType = String(item.type || 'upsert');
      const doubanId = String(
        item.douban_id || item.doubanId || item.media_id || ''
      ).trim();
      if (!doubanId) continue;

      const movie = await prisma.movie.findUnique({ where: { doubanId } });
      if (!movie) continue;

      if (opType === 'delete') {
        await prisma.watchHistory.deleteMany({
          where: {
            userId: user.id,
            movieId: movie.id,
          },
        });
        changes.push({
          type: 'delete',
          douban_id: doubanId,
          occurred_at: new Date().toISOString(),
        });
        continue;
      }

      const episodeNumber = Math.max(
        1,
        Number(item.episode_number ?? item.episodeNumber ?? item.episode ?? 1)
      );
      const episodeTitle = String(
        item.episode_title ||
          item.episodeTitle ||
          item.episode_key ||
          `第${String(episodeNumber).padStart(2, '0')}集`
      );
      const currentTime = Math.max(
        0,
        Math.round(Number(item.current_time ?? item.position_seconds ?? item.currentTime ?? 0))
      );
      const duration = Math.max(
        60,
        Math.round(Number(item.duration ?? item.duration_seconds ?? 3600))
      );
      const sourceKey = String(item.source_key || item.sourceKey || 'ffzy');
      const vodId = String(item.vod_id || item.vodId || `${doubanId}-${sourceKey}`);
      const entryType = String(item.entry_type || item.entry_page || 'watch');

      const saved = await prisma.watchHistory.upsert({
        where: {
          userId_movieId: {
            userId: user.id,
            movieId: movie.id,
          },
        },
        create: {
          userId: user.id,
          movieId: movie.id,
          doubanId,
          episodeNumber,
          episodeTitle,
          sourceKey,
          vodId,
          currentTime,
          duration,
          entryType,
        },
        update: {
          episodeNumber,
          episodeTitle,
          sourceKey,
          vodId,
          currentTime,
          duration,
          entryType,
        },
      });

      // Also mark as 'watching' if user hasn't marked 'watched'
      const existingMark = await prisma.userMovie.findUnique({
        where: { userId_movieId: { userId: user.id, movieId: movie.id } },
      });
      if (!existingMark) {
        await prisma.userMovie.create({
          data: {
            userId: user.id,
            movieId: movie.id,
            doubanId,
            status: 'watching',
          },
        });
      }

      synced += 1;
      changes.push({
        id: saved.id,
        type: 'upsert',
        douban_id: doubanId,
        source_key: sourceKey,
        vod_id: vodId,
        episode: episodeNumber,
        episode_key: episodeTitle,
        position_seconds: currentTime,
        duration_seconds: duration,
        progress_percent: Math.min(100, Math.round((currentTime / duration) * 100)),
        title: movie.title,
        poster: movie.poster,
        updated_at: saved.updatedAt.toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      synced,
      cursor: Date.now(),
      changes,
      conflicts: [],
      requires_full_sync: false,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 400 }
    );
  }
}
