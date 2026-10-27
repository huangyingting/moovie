'use client';

import React, { useState } from 'react';

export default function TvBoxPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://moovie.c2v2.com';
  const tvboxUrl = `${origin}/api/tvbox.json`;
  const vodApiUrl = `${origin}/api/vod`;

  const copyText = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="tvbox-page" style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div
        style={{
          padding: '24px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ fontSize: '22px', margin: '0 0 8px' }}>📺 TVBox 电视端与客户端生态接入指南</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
          影牛 Moovie 提供标准苹果 CMS V10 兼容接口与 TVBox 多源聚合订阅地址，支持在智能电视、投影仪、Apple TV 及移动端播放器中一键导入。
        </p>
      </div>

      {/* Subscription URLs */}
      <section
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          marginBottom: '24px',
          display: 'grid',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
            1. TVBox / 影视仓 一键多源配置接口地址
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <code
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                fontSize: '13px',
                color: 'var(--accent)',
              }}
            >
              {tvboxUrl}
            </code>
            <button
              type="button"
              onClick={() => copyText('tvbox', tvboxUrl)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-solid)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copiedKey === 'tvbox' ? '✓ 已复制' : '复制接口地址'}
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
            2. 标准 VOD 聚合采集站接口 (MacCMS JSON)
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <code
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                fontSize: '13px',
                color: 'var(--text)',
              }}
            >
              {vodApiUrl}
            </code>
            <button
              type="button"
              onClick={() => copyText('vod', vodApiUrl)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {copiedKey === 'vod' ? '✓ 已复制' : '复制 VOD 地址'}
            </button>
          </div>
        </div>
      </section>

      {/* Setup Steps */}
      <section
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          display: 'grid',
          gap: '14px',
        }}
      >
        <h2 style={{ fontSize: '17px', margin: 0 }}>🛠️ 配置步骤说明</h2>
        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <li>在安卓电视、机顶盒或手机上安装 <strong>TVBox 开源版</strong>、<strong>影视仓</strong> 或 <strong>FongMi 影视</strong> 客户端。</li>
          <li>打开应用后进入右上角 <strong>「设置」→「配置地址」</strong>。</li>
          <li>粘贴上方复制的 <code>/api/tvbox.json</code> 地址并点击确定。</li>
          <li>返回首页即可同步浏览影牛全站电影、剧集、综艺、动漫及多线路高清秒播源。</li>
        </ol>
      </section>
    </div>
  );
}
