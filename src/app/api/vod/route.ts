import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CATEGORY_MAP: Record<string, { id: number; name: string }> = {
  movie: { id: 1, name: '电影' },
  tv: { id: 2, name: '剧集' },
  show: { id: 3, name: '综艺' },
  cartoon: { id: 4, name: '动漫' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ac = searchParams.get('ac') || 'list';
  const t = searchParams.get('t') || '';
  const pg = Math.max(1, Number(searchParams.get('pg') || '1'));
  const wd = (searchParams.get('wd') || searchParams.get('q') || '').trim();
  const ids = (searchParams.get('ids') || '').trim();
  const pageSize = 20;

  const typeFilter =
    t === '1' ? 'movie' : t === '2' ? 'tv' : t === '3' ? 'show' : t === '4' ? 'cartoon' : undefined;

  const whereClause: Record<string, unknown> = {};
  if (typeFilter) whereClause.type = typeFilter;
  if (wd) {
    whereClause.OR = [
      { title: { contains: wd } },
      { originalTitle: { contains: wd } },
      { actors: { contains: wd } },
      { directors: { contains: wd } },
    ];
  }
  if (ids) {
    const idList = ids.split(',').map((s) => s.trim()).filter(Boolean);
    whereClause.OR = [{ doubanId: { in: idList } }, { id: { in: idList } }];
  }

  const [total, movies] = await Promise.all([
    prisma.movie.count({ where: whereClause }),
    prisma.movie.findMany({
      where: whereClause,
      include: {
        playbackSources: {
          include: {
            episodes: { orderBy: { episodeNumber: 'asc' } },
          },
        },
      },
      orderBy: [{ isHot: 'desc' }, { viewCount: 'desc' }],
      skip: (pg - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const list = movies.map((m) => {
    const cat = CATEGORY_MAP[m.type] || { id: 1, name: '电影' };
    if (ac === 'list' && !ids) {
      return {
        vod_id: m.doubanId,
        vod_name: m.title,
        type_id: cat.id,
        type_name: cat.name,
        vod_en: m.originalTitle || m.title,
        vod_time: m.updatedAt.toISOString().replace('T', ' ').slice(0, 19),
        vod_remarks: m.episodeBadge || `豆瓣 ${m.rating.toFixed(1)}`,
        vod_play_from: m.playbackSources.map((s) => s.sourceKey).join('$$$') || 'ffzy',
        vod_pic: m.poster,
      };
    }

    const playFrom = m.playbackSources.map((s) => s.sourceName).join('$$$');
    const playUrl = m.playbackSources
      .map((s) => s.episodes.map((ep) => `${ep.title}$${ep.playUrl}`).join('#'))
      .join('$$$');

    return {
      vod_id: m.doubanId,
      vod_name: m.title,
      type_id: cat.id,
      type_name: cat.name,
      vod_pic: m.poster,
      vod_remarks: m.episodeBadge || `豆瓣 ${m.rating.toFixed(1)}`,
      vod_year: m.year,
      vod_area: m.regions,
      vod_lang: m.languages,
      vod_director: m.directors,
      vod_actor: m.actors,
      vod_content: m.summary,
      vod_score: m.rating.toFixed(1),
      vod_play_from: playFrom,
      vod_play_url: playUrl,
    };
  });

  return NextResponse.json({
    code: 1,
    msg: '数据列表',
    page: pg,
    pagecount: Math.max(1, Math.ceil(total / pageSize)),
    limit: String(pageSize),
    total,
    class: [
      { type_id: 1, type_name: '电影' },
      { type_id: 2, type_name: '剧集' },
      { type_id: 3, type_name: '综艺' },
      { type_id: 4, type_name: '动漫' },
    ],
    list,
  });
}
