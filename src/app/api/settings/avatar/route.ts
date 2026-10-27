import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { AdmissionError } from '@/lib/passwords';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let avatar = '🎬';
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      avatar = String(body.avatar || '🎬').trim();
    } else {
      const formData = await request.formData();
      avatar = String(formData.get('avatar') || '🎬').trim();
    }

    if (!avatar || avatar.length > 16) {
      return NextResponse.json({ ok: false, error: '请选择或输入单个 Emoji 表情作为头像' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatar },
    });

    await writeAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'USER_AVATAR_UPDATED',
      targetType: 'User',
      targetId: user.id,
      metadata: { avatar },
    });

    return NextResponse.json({ ok: true, avatar: updated.avatar, message: '头像已保存' });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '保存失败' }, { status: 500 });
  }
}
