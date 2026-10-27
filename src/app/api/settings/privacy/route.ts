import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { AdmissionError } from '@/lib/passwords';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let isPublic = !user.isPublic;
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      if (typeof body.is_public === 'boolean') isPublic = body.is_public;
      else if (typeof body.isPublic === 'boolean') isPublic = body.isPublic;
    } else {
      const formData = await request.formData();
      if (formData.has('is_public')) {
        const val = formData.get('is_public');
        isPublic = val === 'true' || val === 'on' || val === '1';
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isPublic },
    });

    await writeAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'USER_PRIVACY_UPDATED',
      targetType: 'User',
      targetId: user.id,
      metadata: { isPublic },
    });

    return NextResponse.json({
      ok: true,
      isPublic: updated.isPublic,
      message: updated.isPublic ? '已开启公开观影主页' : '已关闭公开观影主页',
    });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '保存失败' }, { status: 500 });
  }
}
