'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type ShellUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
} | null;

export function AppShell({
  user,
  fullWidth = false,
  children,
}: {
  user: ShellUser;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/';
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'light' | 'dark' | null) || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let active = true;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count', {
          headers: { Accept: 'application/json' },
        });
        if (res.ok && active) {
          const data = await res.json();
          setUnreadCount(Number(data.count || 0));
        }
      } catch {
        // ignore network error
      }
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 60000);
    const handler = () => fetchUnread();
    window.addEventListener('notificationsChanged', handler);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('notificationsChanged', handler);
    };
  }, [user, pathname]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="app-container layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <Link href="/" className="logo">
            <img
              src="/static/img/logo.png"
              alt=""
              className="logo-icon"
              width={224}
              height={227}
            />
            <span className="logo-text">Moovie</span>
          </Link>
          <div className="logo-subtitle">发现你的下一部电影</div>
        </div>

        <nav className="sidebar-nav">
          <Link href="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>首页</span>
          </Link>
          <Link href="/discover" className={`nav-item ${isActive('/discover') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
              <polyline points="17 2 12 7 7 2"></polyline>
            </svg>
            <span>热门好片</span>
          </Link>
          <Link href="/trends" className={`nav-item ${isActive('/trends') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span>搜索趋势</span>
          </Link>
          <Link href="/foryou" className={`nav-item ${isActive('/foryou') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>为你推荐</span>
          </Link>
          <Link href="/list" className={`nav-item ${isActive('/list') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <span>片单</span>
          </Link>
          <Link href="/cinema" className={`nav-item ${isActive('/cinema') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>片场</span>
          </Link>
          <Link href="/feed" className={`nav-item ${isActive('/feed') || isActive('/following') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 11a9 9 0 0 1 9 9"></path>
              <path d="M4 4a16 16 0 0 1 16 16"></path>
              <circle cx="5" cy="19" r="1"></circle>
            </svg>
            <span>关注动态</span>
          </Link>
          <Link href="/player" className={`nav-item ${isActive('/player') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
            <span>M3U8 播放器</span>
          </Link>
          <Link href="/iptv" className={`nav-item ${isActive('/iptv') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
              <polyline points="17 2 12 7 7 2"></polyline>
            </svg>
            <span>电视直播</span>
          </Link>
          {user && (user.role === 'ADMIN' || user.role === 'EDITOR') && (
            <Link href="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>管理后台</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-section">
          <div className="section-label">MORE</div>
          <Link href="/feedback" className={`nav-item ${isActive('/feedback') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>建议反馈</span>
          </Link>
          <Link href="/about" className={`nav-item ${isActive('/about') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>关于本站</span>
          </Link>
          <Link href="/advertise" className={`nav-item ${isActive('/advertise') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
            <span>广告合作</span>
          </Link>
          <button
            type="button"
            className="nav-item theme-toggle"
            onClick={toggleTheme}
            title="切换主题"
            aria-label={theme === 'dark' ? '切换为浅色外观' : '切换为深色外观'}
            aria-pressed={theme === 'dark'}
            style={{ width: '100%', textAlign: 'left' }}
          >
            {theme === 'light' ? (
              <svg className="nav-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg className="nav-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
            <span>切换外观</span>
          </button>
        </div>

        <div className="sidebar-footer">
          {user ? (
            <>
              <Link href="/notifications" className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
                  <path d="M10 21h4"></path>
                </svg>
                <span>消息</span>
                <span className="notification-badge-slot">
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </span>
              </Link>
              <Link href="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{user.name || user.email.split('@')[0]}</span>
              </Link>
            </>
          ) : (
            <Link href="/auth/login" className={`nav-item ${isActive('/auth') ? 'active' : ''}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>登录 / 注册</span>
            </Link>
          )}
        </div>
      </aside>

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        id="sidebarOverlay"
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      <main className="main-content">
        <header className="mobile-header">
          <button
            type="button"
            className="hamburger"
            id="mobile-menu-button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="打开导航菜单"
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <Link href="/" className="mobile-logo">
            <img
              src="/static/img/logo.png"
              alt=""
              className="mobile-logo-icon"
              width={224}
              height={227}
            />
            <span>Moovie 影牛</span>
          </Link>
          <div className="mobile-header-actions">
            {user ? (
              <>
                <Link href="/notifications" className="mobile-user mobile-notifications" title="消息" aria-label="查看消息">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
                    <path d="M10 21h4"></path>
                  </svg>
                  <span className="notification-badge-slot">
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                  </span>
                </Link>
                <Link href="/dashboard" className="mobile-user" title={user.name} aria-label="进入个人中心">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </Link>
              </>
            ) : (
              <Link href="/auth/login" className="mobile-user" title="登录" aria-label="登录">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </Link>
            )}
            <button
              type="button"
              className="mobile-theme-toggle theme-toggle"
              onClick={toggleTheme}
              aria-label="切换外观"
            >
              {theme === 'light' ? (
                <svg className="sun-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg className="moon-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className={`content-wrapper ${fullWidth ? 'full-width' : ''}`}>{children}</div>

        <footer className="main-footer">
          <div className="footer-content">
            <div className="footer-links">
              <Link href="/about">关于我们</Link>
              <span className="dot">·</span>
              <Link href="/advertise">广告合作</Link>
              <span className="dot">·</span>
              <Link href="/feedback">问题反馈</Link>
              <span className="dot">·</span>
              <Link href="/changelog">更新记录</Link>
              <span className="dot">·</span>
              <Link href="/dmca">版权声明</Link>
              <span className="dot">·</span>
              <Link href="/privacy">隐私政策</Link>
              <span className="dot">·</span>
              <Link href="/terms">服务协议</Link>
              <span className="dot">·</span>
              <Link href="/tvbox">TVBox 配置</Link>
              <span className="dot">·</span>
              <a href="/sitemap.xml" target="_blank" rel="noreferrer">
                站点地图
              </a>
            </div>
            <p className="copyright">
              © 2026 Moovie 影牛(v4.2.1). 本站不存储任何视频文件，仅提供搜索服务。
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
