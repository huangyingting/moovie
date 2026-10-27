import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { AdmissionError } from '@/lib/passwords';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let doubanId = '';
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      doubanId = String(body.douban_id || body.doubanId || '').trim();
    } else {
      const formData = await request.formData();
      doubanId = String(formData.get('douban_id') || '').trim();
    }

    if (!doubanId) {
      return NextResponse.json({ ok: false, error: '请输入豆瓣账号 ID' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        doubanId,
        doubanLastSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      doubanId: updated.doubanId,
      doubanLastSyncAt: updated.doubanLastSyncAt,
      message: `已绑定豆瓣账号 ${doubanId} 并加入同步队列`,
    });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '绑定失败' }, { status: 500 });
  }
}
