import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const body = await request.json();
  const enabled = Boolean(body.enabled ?? body.ad_skip_enabled ?? true);

  await prisma.user.update({
    where: { id: user.id },
    data: { adSkipEnabled: enabled },
  });

  return NextResponse.json({ ok: true, enabled, ad_skip_enabled: enabled });
}
