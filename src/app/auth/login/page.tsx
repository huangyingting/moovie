'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('邮箱或密码不正确，或者该账号已被管理员吊销访问权限');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('登录请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page"
      style={{
        maxWidth: '420px',
        margin: '36px auto',
        padding: '28px',
        borderRadius: '12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <img
          src="/static/img/logo.png"
          alt="Moovie"
          style={{ width: '44px', height: '44px', borderRadius: '10px', marginBottom: '8px' }}
        />
        <h1 style={{ fontSize: '20px', margin: '0 0 6px' }}>登录 影牛 Moovie</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          跨设备同步观影进度、豆瓣片单与社区互动
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'var(--red-bg)',
            color: 'var(--red)',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
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
            登录密码
          </label>
          <input
            type="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
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
          {loading ? '正在验证身份...' : '登录'}
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
        持有单次受邀注册码？{' '}
        <Link href="/auth/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          使用邀请码注册账号 →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>加载中...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
