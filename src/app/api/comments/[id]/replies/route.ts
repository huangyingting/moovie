import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { AdmissionError } from '@/lib/passwords';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const replies = await prisma.commentReply.findMany({
    where: { commentId: id },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ items: replies });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: '短评不存在' }, { status: 404 });
    }

    let content = '';
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      content = String(body.content || '').trim();
    } else {
      const formData = await request.formData();
      content = String(formData.get('content') || '').trim();
    }

    if (!content) {
      return NextResponse.json({ error: '回复内容不能为空' }, { status: 400 });
    }

    const reply = await prisma.commentReply.create({
      data: {
        commentId: id,
        userId: user.id,
        authorName: user.name || '片友',
        authorAvatar: user.avatar || '🎬',
        content: content.slice(0, 300),
      },
    });

    if (comment.userId && comment.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: comment.userId,
          actorName: user.name || '片友',
          actorAvatar: user.avatar || '🎬',
          actorTargetId: user.id,
          type: 'reply',
          commentId: comment.id,
          movieDoubanId: comment.doubanId,
          message: `${user.name || '片友'} 回复了你的短评：「${reply.content.slice(0, 32)}」`,
        },
      });
    }

    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: '回复失败' }, { status: 500 });
  }
}
