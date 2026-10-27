import React from 'react';
import Link from 'next/link';

export default function DmcaPage() {
  return (
    <div className="dmca-page" style={{ maxWidth: '760px', margin: '0 auto' }}>
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
        <h1 style={{ fontSize: '22px', color: 'var(--text)', margin: '0 0 12px' }}>⚖️ 版权声明与 DMCA 投诉指引</h1>
        <p>
          1. 影牛 Moovie 仅提供公开网络影视元数据的检索与索引服务，本站服务器<strong>不存储、不录制、不转码任何视听媒体文件</strong>。所有视频播放直链均由第三方公开资源站提供。
        </p>
        <p>
          2. 如果您是某部作品的著作权人或合法授权代表，认为本站搜索结果中的第三方链接侵犯了您的合法权益，请通过 <Link href="/feedback" style={{ color: 'var(--accent)' }}>反馈中心</Link> 提交权利证明文件及对应豆瓣编号，我们将在核实后立即屏蔽相关检索结果。
        </p>
      </div>
    </div>
  );
}
