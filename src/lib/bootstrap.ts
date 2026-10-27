import { prisma } from './prisma';
import { writeAuditLog } from './audit';
import { AdmissionError, hashPassword, isValidEmail, normalizeEmail } from './passwords';

/**
 * Provisions or promotes a root Administrator account from the deployment host CLI
 * (`npm run bootstrap:admin -- --email <email> --password <password> --name <name>`).
 *
 * Security invariant: Never exposed via an HTTP API endpoint or public web route.
 */
export async function bootstrapAdmin(input: {
  email: string;
  password: string;
  name?: string | null;
}) {
  if (!isValidEmail(input.email || '')) {
    throw new AdmissionError(400, 'invalid_email', 'Enter a valid administrator email address.');
  }
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  const displayName = input.name?.trim() || email.split('@')[0] || 'Admin';

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });

    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: {
            name: displayName,
            role: 'ADMIN',
            status: 'ACTIVE',
            revokedAt: null,
            revokedReason: null,
            passwordHash,
            emailVerified: existing.emailVerified ?? now,
          },
        })
      : await tx.user.create({
          data: {
            email,
            name: displayName,
            avatar: '👑',
            role: 'ADMIN',
            status: 'ACTIVE',
            passwordHash,
            isPublic: true,
            emailVerified: now,
          },
        });

    await tx.passwordCredential.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        passwordHash,
        passwordChangedAt: now,
      },
      update: {
        passwordHash,
        passwordChangedAt: now,
        resetTokenHash: null,
        resetExpiresAt: null,
      },
    });

    return { user, created: !existing };
  });

  await writeAuditLog({
    actorId: result.user.id,
    actorEmail: result.user.email,
    action: 'ADMIN_BOOTSTRAP',
    targetType: 'User',
    targetId: result.user.id,
    metadata: { created: result.created, role: 'ADMIN' },
  });

  return result;
}
