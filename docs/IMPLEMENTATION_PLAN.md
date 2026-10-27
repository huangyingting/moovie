# Phased Implementation Plan — Moovie 影牛 (v4.2.1)

## Phase 1: Project Scaffolding, Prisma 7 Dual-DB & Static Assets
1. Initialize Next.js 16 (App Router, TypeScript) in `/home/azadmin/moovie`.
2. Configure Prisma 7 (`prisma/schema.prisma` for SQLite dev, `prisma/schema.postgresql.prisma` for PostgreSQL prod, `prisma.config.ts`).
3. Copy original static assets (`/static/img/logo.png`, `/static/img/moovie-app.png`, `/static/img/placeholder.svg`, `/static/manifest.json`) and global stylesheet (`style.css` + page-specific CSS) from `/tmp/moovie-explore/`.
4. Create initial database migration and catalog seed script (`prisma/seed.ts`) with rich movies, TV series, variety shows, anime, playback sources, episodes, curated lists, search trends, danmaku, feedback history, and cinephile community reviews—**strictly without creating any demo login accounts**.

## Phase 2: Auth.js v5, Invite-Only Registration, RBAC, Revocation & CLI Bootstrap
1. Implement `src/lib/auth.ts` with NextAuth v5 Credentials provider, JWT callbacks, and live database revocation/role verification (`getCurrentUser`, `requireUser`, `requireRole`).
2. Implement `src/lib/audit.ts` to record security and admin events in `AuditLog`.
3. Implement `scripts/bootstrap-admin.ts` (`npm run bootstrap:admin`) for CLI-only administrator provisioning.
4. Build `/auth/login`, `/auth/register` (with single-use/expiring invitation code validation), and `/invite/[token]`.
5. Build invitation & user management APIs (`/api/admin/invitations`, `/api/admin/users`, `/api/admin/audit-logs`, `/api/admin/filters`, `/api/admin/feedback`, `/api/admin/lists`).

## Phase 3: Layout Shell, Discovery, Trends, ForYou, Lists & Search
1. Build the shared `AppShell` (desktop 240px `.sidebar`, mobile `.mobile-header` + slide-out drawer, theme toggle, notification unread badge poller, `.main-footer`).
2. Implement Home (`/`) with live search autocomplete (`/api/v2/media/suggest`), recent search tags, Continue Watching (`#continueWatching` + NSFW blur), Today's Updates (`#todayUpdatesSection`), and hot movies preview.
3. Implement `/discover` and `/discover/[category]` (`movie`, `tv`, `show`, `cartoon`, `trending`).
4. Implement `/trends` (`24小时热搜` & `本月热搜`).
5. Implement `/foryou` (Hero recommendation card + paginated `猜你喜欢` grid).
6. Implement `/list` and `/list/[slug]` (4-poster collage cards, numbered list items with editorial notes, related lists).
7. Implement `/search` (structured `媒体库收录` cards, year filter, direct `doubanId` resolution).

## Phase 4: Movie Detail, Multi-Source Watch/Play, Player, IPTV & TVBox
1. Build `/movie/[doubanId]` with breadcrumbs, metadata, expandable cast, rating, `立即播放`, `想看` toggle, `看过` rating/review modal, series seasons, TMDB stills + lightbox, Douban reviews, user short comments (like, reply, `/review/[id]` permalink), multi-source tabs, and similar movies.
2. Build `/similar/[doubanId]` and `/review/[id]`.
3. Build unified `/watch/[doubanId]` and `/play/[sourceKey]/[vodId]` with top `#sourcePanelTop` dropdown, HLS/MP4 player + Danmaku + Crowd-Sourced Ad-Skip (`智能跳过广告`) + 5s auto-next episode, episode navigation (`上一集`/`当前播放`/`下一集`), bottom `#sourcePanel`, and action bar.
4. Build standalone `/player` (M3U8/FLV/MP4 + `?url=` + `&embed=1`).
5. Build `/iptv` (280px collapsible channel drawer, custom `.m3u` loader, client `#EXTINF` parser, grouped channels, live search filter).
6. Build `/tvbox`, `/api/tvbox.json`, and MacCMS v10 `/api/vod`.

## Phase 5: Community (`Cinema`, `Feed`), User Center, Monthly Reports, Feedback & Admin Console
1. Build `/cinema` (`01 本周放映单`, `02 值得停一下的短评`, `03 片友雷达`).
2. Build `/feed` and `/following`.
3. Build `/notifications`, `/dashboard`, `/dashboard/settings` (5 settings cards + emoji avatar picker + Douban sync), and `/user/[id]` (with `想看`, `已看`, `月记` monthly watching report & overlap count).
4. Build `/feedback` (submission + filterable community feed with admin replies).
5. Build `/admin` console (Invitations, Users/Roles/Revocation, Feedback Replies, Curated Lists, Content Filters, Audit Logs).
6. Build static pages (`/about`, `/advertise`, `/changelog`, `/dmca`, `/privacy`, `/terms`, `/sitemap.xml`, `/ads.txt`, `/health`, `/ready`).

## Phase 6: Verification, Automated Tests & Deployment Readiness
1. Run unit and integration tests covering invite-only lifecycle, RBAC, account revocation, CLI bootstrap, and API routes.
2. Run Playwright E2E tests verifying all routes, responsive layouts, dark/light themes, invite-only signup, watch player, IPTV, and admin flows.
3. Provide production deployment artifacts (`Dockerfile`, `docker-compose.yml`, `.env.example`).
