import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { AdmissionError } from '@/lib/passwords';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireRole(['ADMIN', 'EDITOR']);
    const { id } = await context.params;
    const body = await request.json();
    const adminReply = String(body.adminReply || body.reply || '').trim();
    const status = String(body.status || (adminReply ? 'resolved' : 'pending'));

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        adminReply: adminReply || null,
        status,
        repliedAt: adminReply ? new Date() : null,
      },
    });

    await writeAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'FEEDBACK_REPLIED',
      targetType: 'Feedback',
      targetId: updated.id,
      metadata: { status: updated.status, replyLength: adminReply.length },
    });

    return NextResponse.json({ ok: true, feedback: updated });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '回复反馈失败' }, { status: 500 });
  }
}
