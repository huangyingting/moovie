'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminConsolePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [filters, setFilters] = useState<any[]>([]);

  // Invite creation state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'VIEWER' | 'EDITOR' | 'ADMIN'>('VIEWER');
  const [inviteNote, setInviteNote] = useState('');
  const [inviteHours, setInviteHours] = useState(72);
  const [newInviteResult, setNewInviteResult] = useState<{
    rawToken: string;
    inviteUrl: string;
  } | null>(null);

  // Content filter creation state
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterNote, setFilterNote] = useState('');

  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [mRes, iRes, uRes, aRes, fRes] = await Promise.all([
        fetch('/api/v2/admin/metrics'),
        fetch('/api/admin/invitations'),
        fetch('/api/admin/users'),
        fetch('/api/admin/audit-logs?limit=30'),
        fetch('/api/admin/filters'),
      ]);

      if (mRes.status === 401) {
        window.location.href = '/auth/login?callbackUrl=/admin';
        return;
      }
      if (mRes.status === 403) {
        setError('权限不足：仅管理员 (ADMIN) 或编辑 (EDITOR) 可访问后台管理中心');
        return;
      }

      if (mRes.ok) setMetrics(await mRes.json());
      if (iRes.ok) {
        const d = await iRes.json();
        setInvitations(d.items || d.invitations || []);
      }
      if (uRes.ok) {
        const d = await uRes.json();
        setUsers(d.items || d.users || []);
      }
      if (aRes.ok) {
        const d = await aRes.json();
        setAuditLogs(d.items || d.logs || []);
      }
      if (fRes.ok) {
        const d = await fRes.json();
        setFilters(d.items || d.filters || []);
      }
    } catch {
      setError('加载管理数据失败');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail.trim() || undefined,
        role: inviteRole,
        note: inviteNote.trim() || undefined,
        expiresInHours: Number(inviteHours || 72),
      }),
    });
    const data = await res.json();
    if (res.ok && (data.code || data.invitation)) {
      const tokenStr = data.code || data.invitation?.rawToken || data.invitation?.code;
      setNewInviteResult({
        rawToken: tokenStr,
        inviteUrl: `${window.location.origin}/invite/${tokenStr}`,
      });
      setInviteEmail('');
      setInviteNote('');
      loadAll();
    } else {
      alert(data.error || '创建邀请码失败');
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    const res = await fetch(`/api/admin/invitations/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: '管理员手动撤销邀请码' }),
    });
    if (res.ok) loadAll();
  };

  const handleUpdateUser = async (userId: string, patch: { role?: string; status?: string }) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '更新失败');
    } else {
      loadAll();
    }
  };

  const handleAddFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterKeyword.trim()) return;
    await fetch('/api/admin/filters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: filterKeyword.trim(),
        note: filterNote.trim() || undefined,
      }),
    });
    setFilterKeyword('');
    setFilterNote('');
    loadAll();
  };

  if (error) {
    return (
      <div
        style={{
          padding: '48px 20px',
          textAlign: 'center',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <h1 style={{ fontSize: '20px', color: 'var(--red)', marginBottom: '10px' }}>⛔ {error}</h1>
        <Link href="/dashboard" style={{ color: 'var(--accent)' }}>
          返回个人中心
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-console-page" style={{ display: 'grid', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '24px', margin: '0 0 6px' }}>
          🛡️ 影牛 Moovie 平台管理与准入审计中心
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          管理单次受邀注册码 (Invite-Only Admission)、RBAC 角色授权、账号实时吊销、采集源健康监控与安全审计日志
        </p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '12px',
          }}
        >
          {[
            { label: '收录影视总数', val: metrics.catalog?.movies ?? 0 },
            { label: '活跃播放源数', val: metrics.catalog?.sources ?? 0 },
            { label: '分集视频总数', val: metrics.catalog?.episodes ?? 0 },
            { label: '精选片单数', val: metrics.catalog?.lists ?? 0 },
            { label: '注册用户数', val: metrics.community?.users ?? 0 },
            { label: '短评互动数', val: metrics.community?.comments ?? 0 },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>
                {item.val}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite-Only Admission Management */}
      <section
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <h2 style={{ fontSize: '17px', margin: '0 0 14px' }}>
          🎟️ 签发单次限时注册邀请码 (Single-Use Invitation Codes)
        </h2>

        <form
          onSubmit={handleCreateInvitation}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="限定受邀人邮箱（选填）"
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '13px',
            }}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as any)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '13px',
            }}
          >
            <option value="VIEWER">授予角色：VIEWER (普通片友)</option>
            <option value="EDITOR">授予角色：EDITOR (内容策展编辑)</option>
            <option value="ADMIN">授予角色：ADMIN (系统管理员)</option>
          </select>
          <input
            type="number"
            min={1}
            max={720}
            value={inviteHours}
            onChange={(e) => setInviteHours(Number(e.target.value))}
            placeholder="有效期（小时）"
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
            value={inviteNote}
            onChange={(e) => setInviteNote(e.target.value)}
            placeholder="备注信息（选填）"
            style={{
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
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-solid)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + 生成单次邀请码
          </button>
        </form>

        {newInviteResult && (
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'var(--green-bg)',
              border: '1px solid var(--green)',
              marginBottom: '16px',
              fontSize: '13px',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: '6px' }}>
              ✓ 单次邀请码已生成（仅展示一次明文 Token，请妥善发送给受邀用户）：
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', marginBottom: '4px' }}>
              邀请码 Token：<strong>{newInviteResult.rawToken}</strong>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
              快捷受邀链接：<strong>{newInviteResult.inviteUrl}</strong>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>前缀标识</th>
                <th>限定邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>过期时间</th>
                <th>使用者</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{inv.code || inv.codePrefix}</td>
                  <td>{inv.email || '不限邮箱'}</td>
                  <td>
                    <span className={`badge-role ${inv.role}`}>{inv.role}</span>
                  </td>
                  <td>{inv.status}</td>
                  <td>{new Date(inv.expiresAt).toLocaleString()}</td>
                  <td>{inv.acceptedBy?.email || inv.acceptedByUser?.email || '-'}</td>
                  <td>
                    {inv.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleRevokeInvitation(inv.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--red)',
                          background: 'var(--red-bg)',
                          color: 'var(--red)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        撤销邀请码
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* User Role & Revocation Governance */}
      <section
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <h2 style={{ fontSize: '17px', margin: '0 0 14px' }}>
          👥 用户权限与账号吊销管理 (RBAC & Instant Revocation)
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>昵称</th>
                <th>邮箱</th>
                <th>角色 (Role)</th>
                <th>状态 (Status)</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name || u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: '12px',
                      }}
                    >
                      <option value="VIEWER">VIEWER</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: u.status === 'ACTIVE' ? 'var(--green-bg)' : 'var(--red-bg)',
                        color: u.status === 'ACTIVE' ? 'var(--green)' : 'var(--red)',
                        fontWeight: 600,
                        fontSize: '12px',
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleString()}</td>
                  <td>
                    {u.status === 'ACTIVE' ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateUser(u.id, { status: 'REVOKED' })}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--red)',
                          background: 'var(--red-bg)',
                          color: 'var(--red)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        吊销账号
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateUser(u.id, { status: 'ACTIVE' })}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--green)',
                          background: 'var(--green-bg)',
                          color: 'var(--green)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        恢复账号
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Content Filter Governance */}
      <section
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <h2 style={{ fontSize: '17px', margin: '0 0 12px' }}>
          🧹 采集源标题黑名单过滤规则
        </h2>
        <form onSubmit={handleAddFilter} style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            placeholder="过滤关键词（如：博彩、测试片）"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '13px',
            }}
          />
          <input
            type="text"
            value={filterNote}
            onChange={(e) => setFilterNote(e.target.value)}
            placeholder="规则说明"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '13px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent-solid)',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            添加过滤词
          </button>
        </form>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {filters.map((f) => (
            <span
              key={f.id}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                fontSize: '12px',
              }}
            >
              <strong>{f.keyword}</strong> {f.note ? `(${f.note})` : ''}
            </span>
          ))}
        </div>
      </section>

      {/* Security Audit Log Table */}
      <section
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <h2 style={{ fontSize: '17px', margin: '0 0 14px' }}>
          📜 安全审计日志 (Immutable Security Audit Logs)
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>动作 (Action)</th>
                <th>操作者</th>
                <th>目标类型</th>
                <th>摘要说明</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{log.action}</td>
                  <td>{log.actor?.email || 'CLI / System'}</td>
                  <td>{log.targetType}</td>
                  <td>{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
