import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { AdmissionError } from '@/lib/passwords';

export async function POST() {
  try {
    const user = await requireUser();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        doubanId: null,
        doubanLastSyncAt: null,
      },
    });

    return NextResponse.json({ ok: true, message: '已解除豆瓣账号绑定' });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '解绑失败' }, { status: 500 });
  }
}
