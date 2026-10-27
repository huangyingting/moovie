'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterUnread, setFilterUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async (unreadOnly = filterUnread) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications${unreadOnly ? '?unread=true' : ''}`);
      if (res.status === 401) {
        window.location.href = '/auth/login?callbackUrl=/notifications';
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
      setUnreadCount(Number(data.unreadCount || 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(filterUnread);
  }, [filterUnread]);

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', { method: 'POST' });
    loadNotifications(filterUnread);
  };

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    loadNotifications(filterUnread);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    loadNotifications(filterUnread);
  };

  return (
    <div className="notifications-page" style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', margin: '0 0 4px' }}>🔔 消息通知中心</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            未读通知 {unreadCount} 条 · 包含短评点赞、片友回复、新关注与求片反馈进度
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setFilterUnread((prev) => !prev)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: filterUnread ? 'var(--accent-light)' : 'var(--bg-secondary)',
              color: filterUnread ? 'var(--accent)' : 'var(--text)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {filterUnread ? '显示全部通知' : '仅看未读'}
          </button>
          <button
            type="button"
            onClick={handleMarkAllRead}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent-solid)',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            全部标为已读
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          正在加载通知...
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: '14px',
          }}
        >
          暂无消息通知
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {items.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                border: n.isRead ? '1px solid var(--border)' : '1px solid var(--accent)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {!n.isRead && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                      }}
                    />
                  )}
                  <strong style={{ fontSize: '14px' }}>{n.title}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {n.createdAt.slice(0, 10)}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {n.content}{' '}
                  {n.link && (
                    <Link href={n.link} style={{ color: 'var(--accent)', marginLeft: '6px' }}>
                      查看详情 →
                    </Link>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    已读
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
