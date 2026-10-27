import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const [movies, lists] = await Promise.all([
    prisma.movie.findMany({ select: { doubanId: true, updatedAt: true } }),
    prisma.curatedList.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPaths = [
    '/',
    '/discover',
    '/discover/movie',
    '/discover/tv',
    '/discover/show',
    '/discover/cartoon',
    '/discover/trending',
    '/trends',
    '/list',
    '/cinema',
    '/player',
    '/iptv',
    '/tvbox',
    '/about',
    '/advertise',
    '/changelog',
    '/dmca',
    '/privacy',
    '/terms',
  ];

  const urls = [
    ...staticPaths.map((p) => `<url><loc>${origin}${p}</loc></url>`),
    ...movies.map(
      (m) =>
        `<url><loc>${origin}/movie/${m.doubanId}</loc><lastmod>${m.updatedAt.toISOString()}</lastmod></url>`
    ),
    ...movies.map((m) => `<url><loc>${origin}/similar/${m.doubanId}</loc></url>`),
    ...lists.map(
      (l) =>
        `<url><loc>${origin}/list/${l.slug}</loc><lastmod>${l.updatedAt.toISOString()}</lastmod></url>`
    ),
  ].join('\n  ');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
