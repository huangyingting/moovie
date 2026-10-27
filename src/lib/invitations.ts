import { prisma } from './prisma';
import { writeAuditLog } from './audit';
import {
  AdmissionError,
  createInviteToken,
  hashPassword,
  hashToken,
  isValidEmail,
  normalizeEmail,
} from './passwords';

export type RoleType = 'ADMIN' | 'EDITOR' | 'VIEWER';

export const VALID_ROLES: RoleType[] = ['ADMIN', 'EDITOR', 'VIEWER'];

export function normalizeRole(role?: string | null): RoleType {
  const upper = (role || 'VIEWER').toUpperCase();
  if (upper === 'ADMIN' || upper === 'EDITOR' || upper === 'VIEWER') {
    return upper;
  }
  return 'VIEWER';
}

export async function expirePendingInvitations(now = new Date()): Promise<number> {
  const res = await prisma.accountInvitation.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lte: now },
    },
    data: {
      status: 'EXPIRED',
      activeForEmail: null,
    },
  });
  return res.count;
}

export async function createInvitation(input: {
  email?: string | null;
  role?: string | null;
  expiresInHours?: number;
  note?: string | null;
  invitedById?: string | null;
  invitedByEmail?: string | null;
}) {
  await expirePendingInvitations();

  const rawEmail = input.email?.trim() || '';
  let normalizedEmail: string | null = null;
  if (rawEmail) {
    if (!isValidEmail(rawEmail)) {
      throw new AdmissionError(400, 'invalid_email', '请输入有效的邮箱地址');
    }
    normalizedEmail = normalizeEmail(rawEmail);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      throw new AdmissionError(409, 'already_member', '该邮箱已注册账号');
    }
  }

  const hours = Math.min(Math.max(Number(input.expiresInHours) || 168, 1), 720);
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000);
  const code = createInviteToken();
  const tokenHash = hashToken(code);
  const role = normalizeRole(input.role);

  if (normalizedEmail) {
    await prisma.accountInvitation.updateMany({
      where: { activeForEmail: normalizedEmail, status: 'PENDING' },
      data: { activeForEmail: null, status: 'REVOKED', revokedAt: new Date() },
    });
  }

  const invitation = await prisma.accountInvitation.create({
    data: {
      code,
      tokenHash,
      email: rawEmail || null,
      normalizedEmail,
      activeForEmail: normalizedEmail,
      role,
      status: 'PENDING',
      note: input.note?.trim() || null,
      invitedById: input.invitedById || null,
      expiresAt,
    },
  });

  await writeAuditLog({
    actorId: input.invitedById || null,
    actorEmail: input.invitedByEmail || null,
    action: 'INVITE_CREATED',
    targetType: 'AccountInvitation',
    targetId: invitation.id,
    metadata: {
      email: normalizedEmail,
      role,
      expiresAt: expiresAt.toISOString(),
      note: invitation.note,
    },
  });

  return { invitation, code };
}

export async function inspectInvitation(codeOrToken: string, now = new Date()) {
  const trimmed = codeOrToken.trim();
  if (!trimmed) {
    return { valid: false, status: 'INVALID' as const, invitation: null };
  }
  const tokenHash = hashToken(trimmed);
  const invitation = await prisma.accountInvitation.findFirst({
    where: {
      OR: [{ code: trimmed }, { tokenHash }],
    },
  });

  if (!invitation) {
    return { valid: false, status: 'INVALID' as const, invitation: null };
  }

  if (invitation.status === 'PENDING' && invitation.expiresAt <= now) {
    const expired = await prisma.accountInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED', activeForEmail: null },
    });
    return { valid: false, status: 'EXPIRED' as const, invitation: expired };
  }

  return {
    valid: invitation.status === 'PENDING',
    status: invitation.status as 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED',
    invitation,
  };
}

export async function revokeInvitation(input: {
  id: string;
  actorId?: string | null;
  actorEmail?: string | null;
}) {
  const existing = await prisma.accountInvitation.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    throw new AdmissionError(404, 'not_found', '未找到该邀请码');
  }
  if (existing.status !== 'PENDING') {
    throw new AdmissionError(409, 'invalid_state', '只能撤销待使用的邀请码');
  }

  const updated = await prisma.accountInvitation.update({
    where: { id: input.id },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      activeForEmail: null,
    },
  });

  await writeAuditLog({
    actorId: input.actorId || null,
    actorEmail: input.actorEmail || null,
    action: 'INVITE_REVOKED',
    targetType: 'AccountInvitation',
    targetId: updated.id,
    metadata: { code: updated.code, email: updated.normalizedEmail },
  });

  return updated;
}

export async function registerWithInvitation(input: {
  inviteCode: string;
  email: string;
  username: string;
  password: string;
  isPublic?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const code = (input.inviteCode || '').trim();
  if (!code) {
    throw new AdmissionError(400, 'missing_invite', '本站采用邀请制注册，请输入有效邀请码');
  }

  if (!isValidEmail(input.email || '')) {
    throw new AdmissionError(400, 'invalid_email', '请输入有效的邮箱地址');
  }
  const normalizedEmail = normalizeEmail(input.email);

  const username = (input.username || '').trim();
  if (username.length < 2 || username.length > 20) {
    throw new AdmissionError(400, 'invalid_username', '用户名长度需在 2-20 个字符之间');
  }

  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  const inspected = await inspectInvitation(code, now);

  if (!inspected.invitation || !inspected.valid) {
    await writeAuditLog({
      actorEmail: normalizedEmail,
      action: 'INVITE_REJECTED',
      targetType: 'AccountInvitation',
      targetId: inspected.invitation?.id || null,
      metadata: {
        reason: inspected.status,
        attemptedCode: code.slice(0, 12),
      },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    const statusMessages: Record<string, string> = {
      EXPIRED: '该邀请码已过期，请联系管理员重新获取',
      REVOKED: '该邀请码已被撤销',
      ACCEPTED: '该邀请码已被使用（单次有效）',
      INVALID: '邀请码无效，请核对后重试',
    };
    throw new AdmissionError(
      410,
      'invalid_invitation',
      statusMessages[inspected.status] || '邀请码无效、已过期或已被使用'
    );
  }

  const invitation = inspected.invitation;

  if (invitation.normalizedEmail && invitation.normalizedEmail !== normalizedEmail) {
    await writeAuditLog({
      actorEmail: normalizedEmail,
      action: 'INVITE_REJECTED',
      targetType: 'AccountInvitation',
      targetId: invitation.id,
      metadata: { reason: 'EMAIL_MISMATCH', expected: invitation.normalizedEmail },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    throw new AdmissionError(403, 'email_mismatch', '该邀请码已绑定特定邮箱，与当前填写的邮箱不匹配');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingUser) {
    throw new AdmissionError(409, 'already_member', '该邮箱已注册账号，请直接登录');
  }

  const user = await prisma.$transaction(async (tx) => {
    const claimed = await tx.accountInvitation.updateMany({
      where: {
        id: invitation.id,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
      data: {
        status: 'ACCEPTED',
        acceptedAt: now,
        activeForEmail: null,
      },
    });
    if (!claimed.count) {
      throw new AdmissionError(410, 'invalid_invitation', '该邀请码已被使用或已失效');
    }

    const created = await tx.user.create({
      data: {
        email: normalizedEmail,
        emailVerified: now,
        name: username,
        avatar: '🎬',
        role: normalizeRole(invitation.role),
        status: 'ACTIVE',
        isPublic: input.isPublic !== false,
        passwordHash,
        passwordCredential: {
          create: {
            passwordHash,
            passwordChangedAt: now,
          },
        },
      },
    });

    await tx.accountInvitation.update({
      where: { id: invitation.id },
      data: { acceptedById: created.id },
    });

    return created;
  });

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: 'INVITE_ACCEPTED',
    targetType: 'AccountInvitation',
    targetId: invitation.id,
    metadata: { role: user.role, code: invitation.code },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: 'USER_REGISTERED',
    targetType: 'User',
    targetId: user.id,
    metadata: { username: user.name, role: user.role, isPublic: user.isPublic },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return user;
}
