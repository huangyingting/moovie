import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') || '').trim();
  const items = await prisma.feedback.findMany({
    where: type && type !== 'all' ? { type } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    let type = 'bug';
    let movieUrl = '';
    let content = '';

    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      type = String(body.type || 'bug').trim();
      movieUrl = String(body.movie_url || body.movieUrl || '').trim();
      content = String(body.content || '').trim();
    } else {
      const formData = await request.formData();
      type = String(formData.get('type') || 'bug').trim();
      movieUrl = String(formData.get('movie_url') || formData.get('movieUrl') || '').trim();
      content = String(formData.get('content') || '').trim();
    }

    if (!content || content.length < 3) {
      return NextResponse.json({ ok: false, error: '请详细描述您的反馈内容（至少3个字）' }, { status: 400 });
    }

    const validTypes = ['bug', 'request', 'suggestion', 'dmca'];
    const normalizedType = validTypes.includes(type) ? type : 'bug';

    const created = await prisma.feedback.create({
      data: {
        userId: user?.id || null,
        authorName: user?.name || '匿名片友',
        type: normalizedType,
        movieUrl: movieUrl || null,
        content: content.slice(0, 1000),
        status: 'pending',
      },
    });

    return NextResponse.json({ ok: true, feedback: created }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: '提交反馈失败' }, { status: 500 });
  }
}
