import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { AdmissionError, hashPassword, verifyPassword } from '@/lib/passwords';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let currentPassword = '';
    let newPassword = '';
    let confirmPassword = '';

    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      currentPassword = String(body.current_password || body.currentPassword || '');
      newPassword = String(body.new_password || body.newPassword || '');
      confirmPassword = String(body.confirm_password || body.confirmPassword || '');
    } else {
      const formData = await request.formData();
      currentPassword = String(formData.get('current_password') || '');
      newPassword = String(formData.get('new_password') || '');
      confirmPassword = String(formData.get('confirm_password') || '');
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ ok: false, error: '两次输入的新密码不一致' }, { status: 400 });
    }

    const cred = await prisma.passwordCredential.findUnique({
      where: { userId: user.id },
    });
    const storedHash = cred?.passwordHash || user.passwordHash;
    const isValid = await verifyPassword(currentPassword, storedHash);
    if (!isValid) {
      return NextResponse.json({ ok: false, error: '当前密码不正确' }, { status: 400 });
    }

    const nextHash = await hashPassword(newPassword);
    const now = new Date();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: nextHash },
      }),
      prisma.passwordCredential.upsert({
        where: { userId: user.id },
        create: { userId: user.id, passwordHash: nextHash, passwordChangedAt: now },
        update: { passwordHash: nextHash, passwordChangedAt: now },
      }),
    ]);

    await writeAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'USER_PASSWORD_CHANGED',
      targetType: 'User',
      targetId: user.id,
    });

    return NextResponse.json({ ok: true, message: '密码修改成功' });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '密码修改失败' }, { status: 500 });
  }
}
