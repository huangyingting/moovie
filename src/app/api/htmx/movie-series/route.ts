import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doubanId = (searchParams.get('douban_id') || '').trim();
  const title = (searchParams.get('title') || '').trim();
  const format = searchParams.get('format') || '';
  const accept = request.headers.get('accept') || '';

  const basePrefix = title.slice(0, 2);
  const siblings = await prisma.movie.findMany({
    where: {
      doubanId: doubanId ? { not: doubanId } : undefined,
      OR: basePrefix
        ? [{ title: { contains: basePrefix } }, { directors: { contains: basePrefix } }]
        : undefined,
    },
    orderBy: { year: 'asc' },
    take: 4,
  });

  if (format === 'json' || accept.includes('application/json')) {
    return NextResponse.json({
      items: siblings.map((m) => ({
        douban_id: m.doubanId,
        title: m.title,
        year: m.year,
        rating: m.rating,
        poster: m.poster,
      })),
    });
  }

  if (siblings.length === 0) {
    return new NextResponse('', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const html = `<div class="movie-series-strip" style="margin-top:16px;padding:14px;border-radius:10px;background:var(--bg-secondary);border:1px solid var(--border);">
    <div style="font-size:14px;font-weight:700;margin-bottom:10px;">🎞️ 同系列 / 关联作品</div>
    <div style="display:flex;gap:12px;overflow-x:auto;">
      ${siblings
        .map(
          (m) =>
            `<a href="/movie/${m.doubanId}" style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:8px;background:var(--bg);border:1px solid var(--border);color:var(--text);text-decoration:none;font-size:13px;white-space:nowrap;">
              <span>${m.title} (${m.year})</span>
              <span style="color:#f5a623;font-weight:600;">★ ${m.rating.toFixed(1)}</span>
            </a>`
        )
        .join('')}
    </div>
  </div>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
