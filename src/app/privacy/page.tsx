import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="privacy-page" style={{ maxWidth: '760px', margin: '0 auto' }}>
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
        <h1 style={{ fontSize: '22px', color: 'var(--text)', margin: '0 0 12px' }}>🔒 隐私政策 (Privacy Policy)</h1>
        <p>
          <strong>1. 数据收集最小化：</strong>我们仅在您通过受邀注册并登录时保存您的邮箱、加密密码摘要（scrypt + 随机盐）以及您主动标记的观影记录与短评。
        </p>
        <p>
          <strong>2. 观影主页隐私开关：</strong>您可随时在「账号设置」中将个人主页设为私密，关闭后其他用户将无法查看您的想看与看过片单。
        </p>
        <p>
          <strong>3. 本地存储说明：</strong>搜索历史、主题模式（深色/浅色）及未登录状态下的播放进度保存在您的浏览器 LocalStorage 中，您可随时一键清空。
        </p>
      </div>
    </div>
  );
}
