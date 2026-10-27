'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const AVATAR_EMOJIS = [
  '🎬', '🍿', '🎥', '📽️', '🎞️', '⭐', '🌟', '🎭', '🎪', '🎨', '🎵', '🎸', '🎮',
  '🏀', '⚽', '🐱', '🐶', '🐼', '🦊', '🐰', '🦄', '🤖', '👻', '🎅', '🧙', '🥷',
];

export default function DashboardSettingsPage() {
  const [activeSection, setActiveSection] = useState<'all' | 'profile' | 'privacy' | 'playback' | 'security' | 'sync'>('all');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('🎬');
  const [doubanId, setDoubanId] = useState('');
  const [profilePublic, setProfilePublic] = useState(true);
  const [adSkipEnabled, setAdSkipEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Hydrate current user settings from session / profile
    fetch('/api/notifications?limit=1')
      .then((r) => {
        if (r.status === 401) {
          window.location.href = '/auth/login?callbackUrl=/dashboard/settings';
        }
      })
      .catch(() => {});
  }, []);

  const notify = (msg: string, isErr = false) => {
    if (isErr) {
      setError(msg);
      setMessage(null);
    } else {
      setMessage(msg);
      setError(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/settings/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, bio }),
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error || '更新失败', true);
    notify('个人资料已保存');
  };

  const handleSaveAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/settings/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: avatarUrl }),
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error || '头像更新失败', true);
    notify('头像已更新');
  };

  const handleBindDouban = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/settings/douban/bind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ douban_id: doubanId }),
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error || '绑定失败', true);
    notify(`成功绑定豆瓣 ID: ${data.douban_id}`);
  };

  const handleSyncDouban = async () => {
    const res = await fetch('/api/settings/douban/sync', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return notify(data.error || '同步失败', true);
    notify(`豆瓣片单同步完成，共同步 ${data.synced_count} 部影视记录！`);
  };

  const handleUnbindDouban = async () => {
    const res = await fetch('/api/settings/douban/unbind', { method: 'POST' });
    if (res.ok) {
      setDoubanId('');
      notify('已解绑豆瓣账号');
    }
  };

  const handleSavePrivacy = async (nextVal: boolean) => {
    setProfilePublic(nextVal);
    await fetch('/api/settings/privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_public: nextVal }),
    });
    notify('隐私设置已更新');
  };

  const handleSavePlayback = async (nextVal: boolean) => {
    setAdSkipEnabled(nextVal);
    await fetch('/api/settings/playback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad_skip_enabled: nextVal }),
    });
    notify('播放偏好已更新');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/settings/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error || '密码修改失败', true);
    setCurrentPassword('');
    setNewPassword('');
    notify('密码修改成功');
  };

  return (
    <div className="settings-page" style={{ maxWidth: '940px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Link href="/dashboard" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          ← 个人中心
        </Link>
        <h1 style={{ fontSize: '24px', margin: 0 }}>账号设置</h1>
      </div>

      {message && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--green-bg)',
            color: 'var(--green)',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          ✓ {message}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--red-bg)',
            color: 'var(--red)',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Settings Category Navigation (matching 26-dashboard-settings.png) */}
        <nav
          className="settings-sidebar-nav"
          style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            display: 'grid',
            gap: '4px',
          }}
        >
          {[
            { key: 'all', label: '📋 全部设置' },
            { key: 'profile', label: '👤 基本信息' },
            { key: 'privacy', label: '🔗 分享与隐私' },
            { key: 'playback', label: '▷ 播放设置' },
            { key: 'security', label: '🔒 安全设置' },
            { key: 'sync', label: '↔ 数据同步' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveSection(item.key as typeof activeSection)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeSection === item.key ? 'var(--accent-light)' : 'transparent',
                color: activeSection === item.key ? 'var(--accent)' : 'var(--text)',
                fontWeight: activeSection === item.key ? 700 : 500,
                textAlign: 'left',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
          <a
            href="/api/auth/signout"
            style={{
              marginTop: '6px',
              padding: '9px 12px',
              borderRadius: '8px',
              borderTop: '1px solid var(--border)',
              color: 'var(--red)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            🚪 退出登录
          </a>
        </nav>

        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Avatar Setting with 26-Emoji Picker Grid (matching 26-dashboard-settings.png) */}
          {(activeSection === 'all' || activeSection === 'profile') && (
            <form
              onSubmit={handleSaveAvatar}
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'grid',
                gap: '12px',
              }}
            >
              <h2 style={{ fontSize: '16px', margin: 0 }}>🖼️ 头像设置</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--accent-light)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl || '🎬'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                  {AVATAR_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setAvatarUrl(em)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        border: avatarUrl === em ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: avatarUrl === em ? 'var(--accent-light)' : 'var(--bg)',
                        fontSize: '18px',
                        cursor: 'pointer',
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="选择 Emoji 或输入自定义头像 URL"
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--accent-solid)',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  更新头像
                </button>
              </div>
            </form>
          )}

          {/* Profile Info */}
          {(activeSection === 'all' || activeSection === 'profile') && (
            <form
              onSubmit={handleSaveProfile}
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'grid',
                gap: '12px',
              }}
            >
              <h2 style={{ fontSize: '16px', margin: 0 }}>👤 基本资料</h2>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>片友昵称</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入新昵称 (2-24 字符)"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>个人签名</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="介绍一下你的观影口味..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--accent-solid)',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  保存个人资料
                </button>
              </div>
            </form>
          )}

          {/* Douban Bind & Sync */}
          {(activeSection === 'all' || activeSection === 'sync') && (
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'grid',
                gap: '12px',
              }}
            >
              <h2 style={{ fontSize: '16px', margin: 0 }}>🌱 豆瓣账号绑定与片单同步</h2>
              <form onSubmit={handleBindDouban} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={doubanId}
                  onChange={(e) => setDoubanId(e.target.value)}
                  placeholder="输入豆瓣个人主页 ID 或数字编号..."
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--accent-solid)',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  绑定豆瓣
                </button>
                <button
                  type="button"
                  onClick={handleSyncDouban}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  🔄 立即同步豆瓣想看/看过
                </button>
                <button
                  type="button"
                  onClick={handleUnbindDouban}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  解绑
                </button>
              </form>
            </div>
          )}

          {/* Privacy & Playback Toggles */}
          {(activeSection === 'all' || activeSection === 'privacy' || activeSection === 'playback') && (
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'grid',
                gap: '14px',
              }}
            >
              <h2 style={{ fontSize: '16px', margin: 0 }}>🛡️ 隐私与智能去广告偏好</h2>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                <span>公开我的个人观影主页（允许其他片友查看我的想看/看过片单）</span>
                <input
                  type="checkbox"
                  checked={profilePublic}
                  onChange={(e) => handleSavePrivacy(e.target.checked)}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                <span>开启众包智能跳过贴片广告（自动识别并跳过 M3U8 异常 DISCONTINUITY 广告分片）</span>
                <input
                  type="checkbox"
                  checked={adSkipEnabled}
                  onChange={(e) => handleSavePlayback(e.target.checked)}
                />
              </label>
            </div>
          )}

          {/* Password Change */}
          {(activeSection === 'all' || activeSection === 'security') && (
            <form
              onSubmit={handleChangePassword}
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'grid',
                gap: '12px',
              }}
            >
              <h2 style={{ fontSize: '16px', margin: 0 }}>🔑 修改登录密码</h2>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="当前密码"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                }}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新密码（至少 8 位）"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                }}
              />
              <div>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--accent-solid)',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  更新密码
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
