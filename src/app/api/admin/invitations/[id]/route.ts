import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { revokeInvitation } from '@/lib/invitations';
import { AdmissionError } from '@/lib/passwords';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(['ADMIN']);
    const { id } = await context.params;
    const updated = await revokeInvitation({
      id,
      actorId: admin.id,
      actorEmail: admin.email,
    });
    return NextResponse.json({ ok: true, invitation: updated });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '撤销失败' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return DELETE(request, context);
}
