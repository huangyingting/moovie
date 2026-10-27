import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { AdmissionError } from '@/lib/passwords';

export async function POST() {
  try {
    const user = await requireUser();
    if (!user.doubanId) {
      return NextResponse.json({ ok: false, error: '请先绑定豆瓣账号' }, { status: 400 });
    }

    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: { doubanLastSyncAt: now },
    });

    return NextResponse.json({
      ok: true,
      doubanLastSyncAt: now,
      message: '豆瓣观影记录同步已完成',
    });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '同步失败' }, { status: 500 });
  }
}
