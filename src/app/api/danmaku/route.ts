import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const streamKey = (searchParams.get('id') || searchParams.get('streamKey') || '').trim();
  if (!streamKey) {
    return NextResponse.json({ code: 0, data: [] });
  }

  const items = await prisma.danmaku.findMany({
    where: { streamKey },
    orderBy: { time: 'asc' },
    take: 200,
  });

  return NextResponse.json({
    code: 0,
    data: items.map((d) => ({
      id: d.id,
      text: d.text,
      time: d.time,
      color: d.color,
      mode: d.mode,
      author: d.authorName,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const streamKey = String(body.id || body.streamKey || '').trim();
    const text = String(body.text || '').trim().slice(0, 100);
    const time = Math.max(0, Number(body.time || 0));
    const color = String(body.color || '#ffffff');
    const mode = Number(body.mode || 0);

    if (!streamKey || !text) {
      return NextResponse.json({ code: 1, error: '参数缺失' }, { status: 400 });
    }

    const created = await prisma.danmaku.create({
      data: {
        streamKey,
        userId: user?.id || null,
        authorName: user?.name || '片友',
        text,
        time,
        color,
        mode,
      },
    });

    return NextResponse.json({ code: 0, data: created });
  } catch {
    return NextResponse.json({ code: 1, error: '弹幕发送失败' }, { status: 500 });
  }
}
