import { getServerSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { writeAuditLog } from './audit';
import { AdmissionError, normalizeEmail, verifyPassword } from './passwords';
import type { RoleType } from './invitations';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email || '';
        const password = credentials?.password || '';
        if (!rawEmail || !password) return null;

        const email = normalizeEmail(rawEmail);
        const user = await prisma.user.findUnique({
          where: { email },
          include: { passwordCredential: true },
        });

        const storedHash = user?.passwordCredential?.passwordHash || user?.passwordHash || null;
        const isValid = await verifyPassword(password, storedHash);

        if (!user || !isValid) {
          await writeAuditLog({
            actorEmail: email,
            action: 'USER_LOGIN_FAILED',
            targetType: 'User',
            targetId: user?.id || null,
            metadata: { reason: !user ? 'USER_NOT_FOUND' : 'INVALID_PASSWORD' },
          });
          return null;
        }

        if (user.status === 'REVOKED') {
          await writeAuditLog({
            actorId: user.id,
            actorEmail: user.email,
            action: 'USER_LOGIN_REVOKED',
            targetType: 'User',
            targetId: user.id,
            metadata: { reason: user.revokedReason || 'ACCOUNT_REVOKED' },
          });
          throw new Error('AccountRevoked');
        }

        await writeAuditLog({
          actorId: user.id,
          actorEmail: user.email,
          action: 'USER_LOGIN_SUCCESS',
          targetType: 'User',
          targetId: user.id,
          metadata: { role: user.role },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        token.status = (user as unknown as { status: string }).status;
        token.avatar = user.image || '🎬';
      }
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { id: true, name: true, email: true, role: true, status: true, avatar: true },
        });
        if (!dbUser || dbUser.status === 'REVOKED') {
          token.status = 'REVOKED';
        } else {
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.avatar = dbUser.avatar;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.status === 'REVOKED') {
        return { ...session, user: undefined };
      }
      if (session.user && token.id) {
        Object.assign(session.user, {
          id: String(token.id),
          role: String(token.role || 'VIEWER'),
          status: String(token.status || 'ACTIVE'),
          avatar: String(token.avatar || '🎬'),
        });
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'moovie-production-secret-key-2026-v421-c2v2',
};

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.status === 'REVOKED') {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AdmissionError(401, 'unauthorized', '请先登录');
  }
  return user;
}

export async function requireRole(allowedRoles: RoleType[]) {
  const user = await requireUser();
  const userRole = (user.role || 'VIEWER').toUpperCase() as RoleType;
  if (!allowedRoles.includes(userRole)) {
    throw new AdmissionError(403, 'forbidden', '无权执行此操作');
  }
  return user;
}
