import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { AdmissionError } from '@/lib/passwords';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: '短评不存在' }, { status: 404 });
    }

    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId: id, userId: user.id } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      const updated = await prisma.comment.update({
        where: { id },
        data: { likesCount: { decrement: comment.likesCount > 0 ? 1 : 0 } },
      });
      return NextResponse.json({ ok: true, liked: false, likesCount: updated.likesCount });
    }

    await prisma.commentLike.create({
      data: { commentId: id, userId: user.id },
    });
    const updated = await prisma.comment.update({
      where: { id },
      data: { likesCount: { increment: 1 } },
    });

    if (comment.userId && comment.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: comment.userId,
          actorName: user.name || '片友',
          actorAvatar: user.avatar || '🎬',
          actorTargetId: user.id,
          type: 'like',
          commentId: comment.id,
          movieDoubanId: comment.doubanId,
          message: `${user.name || '片友'} 赞了你的短评「${comment.content.slice(0, 28)}」`,
        },
      });
    }

    return NextResponse.json({ ok: true, liked: true, likesCount: updated.likesCount });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
