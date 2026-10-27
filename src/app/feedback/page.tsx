'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type FeedbackItem = {
  id: string;
  type: string;
  content: string;
  movieUrl?: string | null;
  status: string;
  adminReply?: string | null;
  createdAt: string;
};

function FeedbackContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'request';
  const initialMovieUrl = searchParams.get('movie_url') || '';

  const [type, setType] = useState(initialType);
  const [content, setContent] = useState('');
  const [movieUrl, setMovieUrl] = useState(initialMovieUrl);
  const [contact, setContact] = useState('');
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  const loadFeedbacks = async () => {
    const res = await fetch('/api/feedback');
    const data = await res.json();
    if (Array.isArray(data.items)) {
      setItems(data.items);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        content: content.trim(),
        movie_url: movieUrl.trim() || undefined,
        contact: contact.trim() || undefined,
      }),
    });
    if (res.ok) {
      setContent('');
      setSubmittedMsg('感谢你的反馈！管理员处理后将更新状态。');
      loadFeedbacks();
    }
  };

  return (
    <div className="feedback-page" style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: '0 0 6px' }}>📮 求片与问题反馈社区墙</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          找不到想看的影视作品或遇到播放线路失效？提交豆瓣链接或片名，系统将优先补充采集源。
        </p>
      </div>

      {/* Submit Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          marginBottom: '28px',
          display: 'grid',
          gap: '14px',
        }}
      >
        {submittedMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'var(--green-bg)',
              color: 'var(--green)',
              fontSize: '13px',
            }}
          >
            ✓ {submittedMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { id: 'request', label: '🎬 求片补充' },
            { id: 'bug', label: '🛠️ 播放失败 / 线路报错' },
            { id: 'feature', label: '💡 功能建议' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: type === t.id ? 'var(--accent-solid)' : 'var(--bg)',
                color: type === t.id ? '#fff' : 'var(--text)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>
            反馈说明 / 求片名称
          </label>
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请填写影片名称、年份或遇到的具体播放问题..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '13px',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input
            type="text"
            value={movieUrl}
            onChange={(e) => setMovieUrl(e.target.value)}
            placeholder="豆瓣链接或站内播放页地址（选填）"
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '13px',
            }}
          />
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="联系邮箱（选填，便于接收处理通知）"
            style={{
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
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-solid)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            提交反馈
          </button>
        </div>
      </form>

      {/* Public Feedback Board */}
      <section>
        <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
          📋 最新求片与处理进展 ({items.length})
        </h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {items.map((fb) => (
            <div
              key={fb.id}
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                  }}
                >
                  {fb.type === 'request' ? '求片补充' : fb.type === 'bug' ? '故障报错' : '功能建议'}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: fb.status === 'resolved' ? 'var(--green-bg)' : 'var(--yellow-bg)',
                    color: fb.status === 'resolved' ? 'var(--green)' : 'var(--yellow)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {fb.status === 'resolved' ? '✓ 已处理' : '⏳ 处理中'}
                </span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text)' }}>{fb.content}</p>
              {fb.adminReply && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg)',
                    fontSize: '13px',
                    color: 'var(--accent)',
                  }}
                >
                  💬 管理员回复：{fb.adminReply}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>加载反馈中心...</div>}>
      <FeedbackContent />
    </Suspense>
  );
}
