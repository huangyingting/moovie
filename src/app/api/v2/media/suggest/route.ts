import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) {
    return NextResponse.json([]);
  }

  const movies = await prisma.movie.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { originalTitle: { contains: q } },
        { actors: { contains: q } },
        { directors: { contains: q } },
        { doubanId: q },
      ],
    },
    orderBy: [{ viewCount: 'desc' }, { rating: 'desc' }],
    take: 8,
  });

  const envelope = searchParams.get('envelope') === '1';

  const mapped = movies.map((m) => ({
    id: m.doubanId,
    douban_id: m.doubanId,
    title: m.title,
    sub_title: m.originalTitle || '',
    year: m.year,
    type: m.type,
    episode: m.episodeBadge || '',
    rating: m.rating ? m.rating.toFixed(1) : '',
    poster: m.poster,
    img: m.poster,
  }));

  if (envelope) {
    return NextResponse.json({ code: 200, data: mapped, items: mapped });
  }
  return NextResponse.json(mapped);
}
