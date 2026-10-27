import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="about-page" style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gap: '20px' }}>
      <div
        style={{
          padding: '28px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <h1 style={{ fontSize: '24px', margin: '0 0 12px' }}>🎬 关于 影牛 Moovie</h1>
        <p style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
          影牛 (Moovie v4.2.1) 是一个致力于为资深影迷打造的<strong>无广告、多源聚合搜索、豆瓣片单同步与观影互动社区</strong>。我们通过实时并发检索多个第三方公开 VOD 资源库，并结合豆瓣电影元数据、片友测速与众包智能跳过贴片广告技术，为你提供纯粹流畅的观影体验。
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '18px' }}>
          <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>🔍 多源并发聚合</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              毫秒级检索非凡、暴风、量子、索尼等主流片源，展示真实测速与稳定性。
            </span>
          </div>
          <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>⚡ 众包智能跳过广告</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              客户端识别 M3U8 异常分片并通过片友投票自动跳过视频内嵌贴片广告。
            </span>
          </div>
          <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>🌱 豆瓣片单无缝同步</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              支持绑定豆瓣 ID 一键导入想看与看过的影视记录，生成专属口味推荐。
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link href="/changelog" className="btn-mark" style={{ textDecoration: 'none' }}>
          📋 查看更新日志 (v4.2.1)
        </Link>
        <Link href="/tvbox" className="btn-mark" style={{ textDecoration: 'none' }}>
          📺 TVBox 客户端接入
        </Link>
        <Link href="/feedback" className="btn-mark" style={{ textDecoration: 'none' }}>
          📮 求片与问题反馈
        </Link>
      </div>
    </div>
  );
}
