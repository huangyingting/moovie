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
    const { id: targetId } = await context.params;

    if (targetId === user.id) {
      return NextResponse.json({ error: '不能关注自己' }, { status: 400 });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_targetId: {
          followerId: user.id,
          targetId,
        },
      },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      await prisma.notification.deleteMany({
        where: {
          userId: targetId,
          actorTargetId: user.id,
          type: 'follow',
        },
      });
      return NextResponse.json({ ok: true, following: false });
    }

    // Resolve target user or cinephile profile
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    const targetProfile = !targetUser
      ? await prisma.cinephileProfile.findUnique({ where: { id: targetId } })
      : null;

    if (!targetUser && !targetProfile) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const targetName = targetUser?.name || targetProfile?.username || '片友';
    const targetAvatar = targetUser?.avatar || targetProfile?.avatar || '🎬';

    await prisma.follow.create({
      data: {
        followerId: user.id,
        targetId,
        targetName,
        targetAvatar,
      },
    });

    if (targetUser) {
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          actorName: user.name || '片友',
          actorAvatar: user.avatar || '🎬',
          actorTargetId: user.id,
          type: 'follow',
          message: `${user.name || '片友'} 关注了你`,
        },
      });
    }

    return NextResponse.json({ ok: true, following: true });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
