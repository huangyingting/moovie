import { NextResponse } from 'next/server';
import { inspectInvitation } from '@/lib/invitations';

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const result = await inspectInvitation(token);
  if (!result.invitation) {
    return NextResponse.json(
      { valid: false, status: 'INVALID', message: '邀请码不存在或已失效' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    valid: result.valid,
    status: result.status,
    code: result.invitation.code,
    email: result.invitation.email,
    role: result.invitation.role,
    expiresAt: result.invitation.expiresAt,
    invitation: {
      code: result.invitation.code,
      email: result.invitation.email,
      role: result.invitation.role,
      expiresAt: result.invitation.expiresAt,
    },
  });
}
