import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const doubanId = String(body.douban_id || body.doubanId || '');
    if (doubanId) {
      await prisma.movie.updateMany({
        where: { doubanId },
        data: { viewCount: { increment: 1 } },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
