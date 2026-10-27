import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  await prisma.watchHistory.deleteMany({
    where: {
      userId: user.id,
      OR: [{ id }, { doubanId: id }],
    },
  });

  return NextResponse.json({ ok: true });
}
