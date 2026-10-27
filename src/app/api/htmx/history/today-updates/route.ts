import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || '';
  const accept = request.headers.get('accept') || '';

  const user = await getCurrentUser().catch(() => null);

  const series = await prisma.movie.findMany({
    where: {
      OR: [{ nextAirDate: { not: null } }, { type: 'tv' }],
    },
    orderBy: { updatedAt: 'desc' },
    take: 4,
  });

  const items = series.map((m) => ({
    douban_id: m.doubanId,
    title: m.title,
    poster: m.poster,
    episode_badge: m.episodeBadge || `全${m.episodeCount}集`,
    next_air_date: m.nextAirDate || '今日更新',
  }));

  if (format === 'json' || accept.includes('application/json')) {
    return NextResponse.json({
      authenticated: Boolean(user),
      items,
    });
  }

  if (items.length === 0) {
    return new NextResponse('', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const html = `<div class="today-updates-inner" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-radius:10px;background:var(--bg-secondary);border:1px solid var(--border);margin-bottom:14px;font-size:13px;">
    <span style="font-weight:700;color:var(--accent);">📅 今日追剧更新：</span>
    ${items
      .map(
        (it) =>
          `<a href="/watch/${it.douban_id}" style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:14px;background:var(--bg);border:1px solid var(--border);color:var(--text);text-decoration:none;font-size:12px;">
            <strong>${it.title}</strong>
            <span style="color:var(--accent);">${it.episode_badge}</span>
          </a>`
      )
      .join('')}
  </div>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
