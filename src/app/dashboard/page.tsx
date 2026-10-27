import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MovieCard } from '@/components/MovieCard';
import { ShareProfileButton } from '@/components/MovieDetailInteractions';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    redirect('/auth/login?callbackUrl=/dashboard');
  }

  const sp = await searchParams;
  const activeTab = sp.tab || 'all';

  const [history, userMovies, myComments, myFeedbacks] = await Promise.all([
    prisma.watchHistory.findMany({
      where: { userId: user.id },
      include: { movie: true },
      orderBy: { updatedAt: 'desc' },
      take: 12,
    }),
    prisma.userMovie.findMany({
      where: { userId: user.id },
      include: { movie: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.comment.findMany({
      where: { userId: user.id },
      include: { movie: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.feedback.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const watchedList = userMovies.filter((m) => m.status === 'watched');
  const wishList = userMovies.filter((m) => m.status === 'wish');
  const displayName = user.name || user.email.split('@')[0];
  const joinDate = user.createdAt ? user.createdAt.toISOString().slice(0, 10) : '2026-04-12';

  return (
    <div className="dashboard-page">
      {/* User Summary Header (matching 13-dashboard.png) */}
      <section
        style={{
          padding: '24px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 800,
            }}
          >
            {user.avatar && user.avatar.length <= 2
              ? user.avatar
              : displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', margin: 0 }}>{displayName}</h1>
              <span className={`badge-role ${user.role}`}>{user.role}</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: user.isPublic ? 'var(--green-bg)' : 'var(--bg)',
                  color: user.isPublic ? 'var(--green)' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {user.isPublic ? '公开主页' : '私密主页'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 8px' }}>
              注册于 {joinDate} · {user.email} {user.doubanId ? `· 已绑定豆瓣 ID: ${user.doubanId}` : ''}
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>在看 {history.length} 部</span>
              <span>想看 {wishList.length} 部</span>
              <span>已看 {watchedList.length} 部</span>
              <span>短评 {myComments.length} 条</span>
              <span>反馈 {myFeedbacks.length} 条</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <ShareProfileButton userId={user.id} label="分享主页" />
          <Link
            href={`/user/${user.id}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            个人公开主页
          </Link>
          <Link
            href="/dashboard/settings"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--accent-solid)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            ⚙️ 账号与豆瓣同步设置
          </Link>
          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              🛡️ 管理后台
            </Link>
          )}
        </div>
      </section>

      {/* Dashboard Tabs + Connection & Share Quick Card (matching 13-dashboard.png) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        <div>
          <div
            className="dashboard-tabs"
            style={{
              display: 'flex',
              gap: '22px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '10px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            <Link
              href="/dashboard"
              style={{
                color: activeTab === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'all' ? 700 : 500,
                textDecoration: 'none',
              }}
            >
              全部概览
            </Link>
            <Link
              href="/dashboard?tab=watching"
              style={{
                color: activeTab === 'watching' ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'watching' ? 700 : 500,
                textDecoration: 'none',
              }}
            >
              🕒 在看 {history.length}
            </Link>
            <Link
              href="/dashboard?tab=wish"
              style={{
                color: activeTab === 'wish' ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'wish' ? 700 : 500,
                textDecoration: 'none',
              }}
            >
              ♡ 想看 {wishList.length}
            </Link>
            <Link
              href="/dashboard?tab=watched"
              style={{
                color: activeTab === 'watched' ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'watched' ? 700 : 500,
                textDecoration: 'none',
              }}
            >
              ✓ 已看 {watchedList.length}
            </Link>
            <Link
              href="/dashboard?tab=feedback"
              style={{
                color: activeTab === 'feedback' ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'feedback' ? 700 : 500,
                textDecoration: 'none',
              }}
            >
              💬 反馈 {myFeedbacks.length}
            </Link>
          </div>

          {/* Continue Watching */}
          {(activeTab === 'all' || activeTab === 'watching') && (
            <section style={{ marginBottom: '28px' }}>
              <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
                ▶️ 观看历史 ({history.length})
              </h2>
              {history.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    borderRadius: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                  }}
                >
                  还没有观影记录 ·{' '}
                  <Link href="/discover" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    去看片 →
                  </Link>
                </div>
              ) : (
                <div className="movie-grid">
                  {history.map((h) => {
                    const pct =
                      h.duration > 0
                        ? Math.min(100, Math.round((h.currentTime / h.duration) * 100))
                        : 10;
                    return (
                      <MovieCard
                        key={h.id}
                        doubanId={h.movie.doubanId}
                        title={h.movie.title}
                        year={h.movie.year}
                        type={h.movie.type}
                        poster={h.movie.poster}
                        rating={h.movie.rating}
                        badge={`${h.episodeTitle} (${pct}%)`}
                        href={`/watch/${h.movie.doubanId}?source=${h.sourceKey}&ep=${h.episodeNumber}`}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Watched Movies */}
          {(activeTab === 'all' || activeTab === 'watched') && (
            <section style={{ marginBottom: '28px' }}>
              <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
                ✅ 我看过的影视 ({watchedList.length})
              </h2>
              {watchedList.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  还没有标记过看过的影片
                </div>
              ) : (
                <div className="movie-grid">
                  {watchedList.map((um) => (
                    <MovieCard
                      key={um.id}
                      doubanId={um.movie.doubanId}
                      title={um.movie.title}
                      year={um.movie.year}
                      type={um.movie.type}
                      poster={um.movie.poster}
                      rating={um.movie.rating}
                      badge={um.rating ? `我的评分 ★${um.rating}` : '已看'}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Wish List */}
          {(activeTab === 'all' || activeTab === 'wish') && (
            <section style={{ marginBottom: '28px' }}>
              <h2 className="section-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
                ❤️ 我想看的影视 ({wishList.length})
              </h2>
              {wishList.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>想看片单为空</div>
              ) : (
                <div className="movie-grid">
                  {wishList.map((um) => (
                    <MovieCard
                      key={um.id}
                      doubanId={um.movie.doubanId}
                      title={um.movie.title}
                      year={um.movie.year}
                      type={um.movie.type}
                      poster={um.movie.poster}
                      rating={um.movie.rating}
                      badge="想看"
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* My Feedbacks Tab (matching 13-dashboard.png 反馈 tab) */}
          {(activeTab === 'all' || activeTab === 'feedback') && (
            <section style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 className="section-title" style={{ fontSize: '17px', margin: 0 }}>
                  💬 我的反馈与求片 ({myFeedbacks.length})
                </h2>
                <Link href="/feedback" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>
                  + 提交新反馈
                </Link>
              </div>
              {myFeedbacks.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  暂无提交过的反馈记录
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {myFeedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600 }}>
                          [{fb.type === 'request' ? '求片' : fb.type === 'bug' ? '播放故障' : '建议'}] {fb.content}
                        </span>
                        <span
                          style={{
                            color: fb.status === 'resolved' ? 'var(--green)' : 'var(--accent)',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {fb.status === 'resolved' ? '✓ 已解决' : '处理中'}
                        </span>
                      </div>
                      {fb.adminReply && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          管理员回复：{fb.adminReply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Sidebar: 连接与分享 Card (from 13-dashboard.png) */}
        <aside
          style={{
            padding: '18px',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            display: 'grid',
            gap: '16px',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '14px' }}>连接与分享</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>🌐 公开主页</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                允许他人查看你的观影记录
              </div>
            </div>
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '12px',
                background: user.isPublic ? 'var(--green-bg)' : 'var(--bg)',
                color: user.isPublic ? 'var(--green)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {user.isPublic ? '已开启' : '已关闭'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>↔ 豆瓣同步</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {user.doubanId ? `已绑定: ${user.doubanId}` : '同步你的豆瓣观影记录'}
              </div>
            </div>
            <Link
              href="/dashboard/settings"
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                textDecoration: 'none',
                fontSize: '12px',
              }}
            >
              {user.doubanId ? '管理' : '绑定'}
            </Link>
          </div>

          <div style={{ textAlign: 'center', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <Link
              href="/dashboard/settings"
              style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              更多设置 →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
