import React from 'react';

export default function TermsPage() {
  return (
    <div className="terms-page" style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div
        style={{
          padding: '28px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          fontSize: '14px',
          lineHeight: 1.75,
          color: 'var(--text-secondary)',
        }}
      >
        <h1 style={{ fontSize: '22px', color: 'var(--text)', margin: '0 0 12px' }}>📄 服务条款与社区准则 (Terms of Service)</h1>
        <p>
          <strong>1. 邀请制准入规范：</strong>影牛 Moovie 采用单次受邀注册制，严禁买卖、批量滥用邀请码。违反社区规范的账号将被管理员即时吊销访问权限。
        </p>
        <p>
          <strong>2. 友善观影讨论：</strong>发表短评、回复与弹幕时请尊重创作者与其他片友，禁止恶意剧透、人身攻击或发布垃圾广告。
        </p>
        <p>
          <strong>3. 第三方内容免责：</strong>视频流内嵌的任何滚动字幕广告均来自上游采集源，切勿轻信任何外部网址。
        </p>
      </div>
    </div>
  );
}
