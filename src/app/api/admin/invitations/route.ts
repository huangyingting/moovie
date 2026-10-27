import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { createInvitation, expirePendingInvitations } from '@/lib/invitations';
import { AdmissionError } from '@/lib/passwords';

export async function GET() {
  try {
    await requireRole(['ADMIN']);
    await expirePendingInvitations();
    const invitations = await prisma.accountInvitation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        invitedBy: { select: { id: true, name: true, email: true } },
        acceptedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ ok: true, items: invitations });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: 'Failed to load invitations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(['ADMIN']);
    const body = await request.json();
    const result = await createInvitation({
      email: body.email || null,
      role: body.role || 'VIEWER',
      expiresInHours: Number(body.expiresInHours || 168),
      note: body.note || null,
      invitedById: admin.id,
      invitedByEmail: admin.email,
    });

    return NextResponse.json(
      {
        ok: true,
        invitation: result.invitation,
        code: result.code,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '创建邀请码失败' }, { status: 500 });
  }
}
