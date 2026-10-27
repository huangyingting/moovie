import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { inspectInvitation } from '@/lib/invitations';

export const dynamic = 'force-dynamic';

export default async function InviteTokenLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await inspectInvitation(token);

  if (info.valid) {
    redirect(`/auth/register?invite=${encodeURIComponent(token)}`);
  }

  const reasonMap: Record<string, string> = {
    ACCEPTED: '该邀请码已被使用（单次有效）。',
    EXPIRED: '该邀请码已过期，请联系管理员重新获取。',
    REVOKED: '该邀请码已被管理员撤销。',
    INVALID: '该邀请码不存在或格式无效。',
  };

  return (
    <div
      style={{
        maxWidth: '460px',
        margin: '48px auto',
        padding: '28px',
        borderRadius: '12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '42px', marginBottom: '10px' }}>⚠️</div>
      <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>邀请链接不可用</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
        {reasonMap[info.status] || '该邀请码不存在、已被使用、已过期或已被管理员撤销。'}
      </p>
      <Link
        href="/auth/login"
        style={{
          padding: '9px 18px',
          borderRadius: '8px',
          background: 'var(--accent-solid)',
          color: '#fff',
          textDecoration: 'none',
          fontSize: '13px',
        }}
      >
        返回登录页
      </Link>
    </div>
  );
}
