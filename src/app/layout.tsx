import type { Metadata } from 'next';
import './globals.css';
import { getCurrentUser } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: '影牛 Moovie — 聚合影视搜索与在线观看',
  description: '影牛 Moovie v4.2.1 — 多源影视搜索引擎、豆瓣高分推荐、片单精选、实时追剧日历与社区互动',
  manifest: '/static/manifest.json',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser().catch(() => null);

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/static/css/style.css" />
        <link rel="icon" href="/static/img/logo.png" />
      </head>
      <body>
        <AppShell
          user={
            user
              ? {
                  id: user.id,
                  email: user.email,
                  name: user.name || user.email.split('@')[0],
                  role: user.role,
                  avatar: user.avatar || '🎬',
                }
              : null
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
