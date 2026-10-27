'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInvite = searchParams.get('invite') || searchParams.get('token') || '';

  const [invitationToken, setInvitationToken] = useState(initialInvite);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteInfo, setInviteInfo] = useState<{
    role: string;
    email?: string | null;
    expiresAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = invitationToken.trim();
    if (!token || token.length < 8) {
      setInviteInfo(null);
      return;
    }
    fetch(`/api/auth/invite/${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) {
          setInviteInfo(null);
          return;
        }
        const data = await r.json();
        if (data.invitation) {
          setInviteInfo(data.invitation);
          if (data.invitation.email && !email) {
            setEmail(data.invitation.email);
          }
        }
      })
      .catch(() => {});
  }, [invitationToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationToken: invitationToken.trim(),
          email: email.trim(),
          username: username.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '注册失败，请检查邀请码是否有效');
        setLoading(false);
        return;
      }

      // Automatically sign in the newly registered user
      await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('网络请求异常，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page"
      style={{
        maxWidth: '440px',
        margin: '36px auto',
        padding: '28px',
        borderRadius: '12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img
          src="/static/img/logo.png"
          alt="Moovie"
          style={{ width: '44px', height: '44px', borderRadius: '10px', marginBottom: '8px' }}
        />
        <h1 style={{ fontSize: '20px', margin: '0 0 6px' }}>受邀注册 影牛 Moovie</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          本站采用严格邀请制准入（单次有效且限时），请输入管理员签发的邀请码
        </p>
      </div>

      {inviteInfo && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'var(--green-bg)',
            color: 'var(--green)',
            fontSize: '12px',
            marginBottom: '14px',
          }}
        >
          ✓ 邀请码有效 · 预设角色：<strong>{inviteInfo.role}</strong>
          {inviteInfo.email ? ` · 绑定邮箱：${inviteInfo.email}` : ''}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'var(--red-bg)',
            color: 'var(--red)',
            fontSize: '13px',
            marginBottom: '14px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
            单次邀请码 (Invitation Token)
          </label>
          <input
            type="text"
            name="invitationToken"
            required
            value={invitationToken}
            onChange={(e) => setInvitationToken(e.target.value)}
            placeholder="mv_inv_..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
            邮箱地址
          </label>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
            片友昵称
          </label>
          <input
            type="text"
            name="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="2-24 个字符"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
            设置密码（至少 8 位）
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 8 个字符"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '4px',
            padding: '11px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-solid)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {loading ? '正在激活受邀账号...' : '验证邀请码并完成注册'}
        </button>
      </form>

      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}
      >
        已有账号？{' '}
        <Link href="/auth/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          前往登录 →
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>加载中...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
