import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { AdmissionError } from '@/lib/passwords';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let adSkipEnabled = !user.adSkipEnabled;
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      if (typeof body.ad_skip_enabled === 'boolean') adSkipEnabled = body.ad_skip_enabled;
      else if (typeof body.adSkipEnabled === 'boolean') adSkipEnabled = body.adSkipEnabled;
    } else {
      const formData = await request.formData();
      if (formData.has('ad_skip_enabled')) {
        const val = formData.get('ad_skip_enabled');
        adSkipEnabled = val === 'true' || val === 'on' || val === '1';
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { adSkipEnabled },
    });

    return NextResponse.json({
      ok: true,
      adSkipEnabled: updated.adSkipEnabled,
      message: updated.adSkipEnabled ? '已启用智能跳过广告' : '已关闭智能跳过广告',
    });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '保存失败' }, { status: 500 });
  }
}
