import { NextResponse } from 'next/server';
import { registerWithInvitation } from '@/lib/invitations';
import { AdmissionError } from '@/lib/passwords';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    const user = await registerWithInvitation({
      inviteCode: String(body.inviteCode || body.code || body.invitationToken || ''),
      email: String(body.email || ''),
      username: String(body.username || body.name || ''),
      password: String(body.password || ''),
      isPublic: body.isPublic !== false && body.is_public !== false,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json(
        { ok: false, code: err.code, error: err.message },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
