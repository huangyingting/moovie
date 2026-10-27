import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { AdmissionError } from '@/lib/passwords';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let username = '';
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      username = String(body.username || body.name || '').trim();
    } else {
      const formData = await request.formData();
      username = String(formData.get('username') || formData.get('name') || '').trim();
    }

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json({ ok: false, error: '用户名长度需在 2-20 个字符之间' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: username },
    });

    await writeAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'USER_NAME_UPDATED',
      targetType: 'User',
      targetId: user.id,
      metadata: { username },
    });

    return NextResponse.json({ ok: true, username: updated.name, message: '用户名已更新' });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '更新失败' }, { status: 500 });
  }
}
