import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { normalizeRole } from '@/lib/invitations';
import { AdmissionError } from '@/lib/passwords';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(['ADMIN']);
    const { id } = await context.params;
    const body = await request.json();

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ ok: false, error: '用户不存在' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    let auditAction = 'USER_UPDATED';

    if (body.role !== undefined) {
      const nextRole = normalizeRole(String(body.role));
      if (target.id === admin.id && nextRole !== 'ADMIN') {
        return NextResponse.json(
          { ok: false, error: '不能降级当前登录的管理员账号' },
          { status: 400 }
        );
      }
      updateData.role = nextRole;
      auditAction = 'USER_ROLE_CHANGED';
    }

    if (body.status !== undefined) {
      const nextStatus = String(body.status).toUpperCase() === 'REVOKED' ? 'REVOKED' : 'ACTIVE';
      if (target.id === admin.id && nextStatus === 'REVOKED') {
        return NextResponse.json(
          { ok: false, error: '不能停用当前登录的管理员账号' },
          { status: 400 }
        );
      }
      updateData.status = nextStatus;
      updateData.revokedAt = nextStatus === 'REVOKED' ? new Date() : null;
      updateData.revokedReason =
        nextStatus === 'REVOKED' ? String(body.reason || '管理员停用访问权限') : null;
      auditAction = nextStatus === 'REVOKED' ? 'USER_REVOKED' : 'USER_RESTORED';

      if (nextStatus === 'REVOKED') {
        await prisma.session.deleteMany({ where: { userId: target.id } });
      }
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        revokedAt: true,
        revokedReason: true,
      },
    });

    await writeAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      action: auditAction,
      targetType: 'User',
      targetId: updated.id,
      metadata: {
        targetEmail: updated.email,
        role: updated.role,
        status: updated.status,
        reason: updated.revokedReason,
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: '操作失败' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}
