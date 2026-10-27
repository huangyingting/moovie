import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const { unitId } = await params;
  const { searchParams } = new URL(request.url);
  const epParam = Number(searchParams.get('ep') || '1') || 1;

  const cleanDoubanId = unitId.split('_')[0].split('-')[0];
  const movie =
    (await prisma.movie.findUnique({
      where: { doubanId: cleanDoubanId },
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
    })) ||
    (await prisma.movie.findFirst({
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
    }));

  if (!movie) {
    return NextResponse.json({ unit_id: unitId, candidates: [] });
  }

  const candidates = movie.playbackSources.map((src, idx) => {
    const ep =
      src.episodes.find((e) => e.episodeNumber === epParam) || src.episodes[0];
    return {
      rank: idx + 1,
      source_key: src.sourceKey,
      source_name: src.sourceName,
      vod_id: src.vodId,
      version_label: src.versionLabel,
      episode: ep?.episodeNumber || 1,
      episode_title: ep?.title || 'HD中字',
      play_url: ep?.playUrl || '',
      latency_ms: src.loadSpeedMs,
      stability: src.stability,
      health_score: Math.max(50, 100 - Math.round(src.loadSpeedMs / 40)),
    };
  });

  return NextResponse.json({
    unit_id: unitId,
    douban_id: movie.doubanId,
    title: movie.title,
    candidates,
  });
}
