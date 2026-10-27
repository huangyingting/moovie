import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { AdmissionError } from '@/lib/passwords';

export async function GET() {
  try {
    await requireRole(['ADMIN']);
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        isPublic: true,
        adSkipEnabled: true,
        revokedAt: true,
        revokedReason: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ ok: true, items: users });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: 'Failed to list users' }, { status: 500 });
  }
}
