import { prisma } from './prisma';

export type AuditLogInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(input: AuditLogInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: input.actorId || null,
        actorEmail: input.actorEmail || null,
        action: input.action,
        targetType: input.targetType || null,
        targetId: input.targetId || null,
        metadata: JSON.stringify(input.metadata ?? {}),
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err);
    return null;
  }
}

export async function listAuditLogs(limit = 100, actionFilter?: string) {
  return prisma.auditLog.findMany({
    where: actionFilter ? { action: actionFilter } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actor: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}
