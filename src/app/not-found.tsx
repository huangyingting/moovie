import React from 'react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div
      style={{
        padding: '72px 20px',
        textAlign: 'center',
        maxWidth: '520px',
        margin: '0 auto',
      }}
    >
      <div style={{ fontSize: '64px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
        404
      </div>
      <h1 style={{ fontSize: '22px', marginTop: '16px', marginBottom: '10px' }}>
        页面走丢了 · 找不到这部影片或页面
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
        你访问的地址可能已变更、下架或输入有误。你可以返回首页搜索想看的电影、剧集、综艺或动漫。
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <Link
          href="/"
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'var(--accent-solid)',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          返回首页
        </Link>
        <Link
          href="/discover"
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          浏览找片
        </Link>
      </div>
    </div>
  );
}
