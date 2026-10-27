import React from 'react';
import Link from 'next/link';

export default function AdvertisePage() {
  return (
    <div className="advertise-page" style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div
        style={{
          padding: '28px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <h1 style={{ fontSize: '22px', margin: '0 0 10px' }}>🤝 商务合作与赞助支持</h1>
        <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '16px' }}>
          影牛 Moovie 坚持克制、清爽的社区氛围，严禁任何博彩、诈骗、色情及诱导性弹窗广告。我们仅接受正规影视宣发、独立电影展映、硬件外设及流媒体工具品牌的合规展示合作。
        </p>
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            fontSize: '13px',
            lineHeight: 1.7,
          }}
        >
          <div><strong>合作联系：</strong>可直接在 <Link href="/feedback" style={{ color: 'var(--accent)' }}>问题反馈页</Link> 提交合作意向与联系方式。</div>
          <div><strong>排片展映合作：</strong>支持在「精选片单」与「院线热映」板块进行独立影展专题策展。</div>
        </div>
      </div>
    </div>
  );
}
