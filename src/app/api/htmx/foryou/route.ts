import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const pageSize = 5;

  const movies = await prisma.movie.findMany({
    orderBy: [{ rating: 'desc' }, { viewCount: 'desc' }],
    skip: ((page - 1) * pageSize) % 7,
    take: pageSize,
  });

  return NextResponse.json({
    ok: true,
    page,
    items: movies,
  });
}
