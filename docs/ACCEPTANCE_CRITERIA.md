# Acceptance Criteria — Moovie 影牛 (v4.2.1)

## AC-1: Visual, Layout & Responsive Parity
- **AC-1.1**: All pages render inside the authentic Moovie layout (`240px` fixed left `.sidebar` on desktop, `.mobile-header` + slide-out `.sidebar.open` drawer at `<= 768px`, and `.main-footer` with version `v4.2.1` and static links).
- **AC-1.2**: Clicking `切换外观` toggles `data-theme="light"` and `data-theme="dark"` on `<html>`, persists in `localStorage['theme']`, and applies the exact CSS custom properties (`#ffffff` / `#17181b`, `--accent: #cc5656` / `#d46a6a`).
- **AC-1.3**: Non-existent routes (including `/login`) return HTTP `404` with the branded `页面未找到` UI and `返回首页` CTA.

## AC-2: Zero Demo Accounts, CLI Admin Bootstrap & Invite-Only Registration
- **AC-2.1**: Running `npx prisma db seed` seeds rich movies, episodes, playback sources, curated lists, search trends, and public catalog reviews, but creates **0 login-capable demo `User` rows** (`User` table has no pre-seeded demo credentials).
- **AC-2.2**: Running `npm run bootstrap:admin -- --email <email> --password <pass> --username <name>` creates or updates an `ADMIN` user (`status = ACTIVE`) and appends an `ADMIN_BOOTSTRAP` entry to `AuditLog`.
- **AC-2.3**: Visiting `/auth/register` without a valid invitation code or submitting an invalid, expired, revoked, or already-used invitation code rejects registration with a clear Chinese error message (`邀请码无效、已过期或已被使用`) and records an `INVITE_REJECTED` audit log entry.
- **AC-2.4**: Submitting `/auth/register` with a valid `PENDING` invitation code creates the user with the invitation's assigned role (`VIEWER`, `EDITOR`, or `ADMIN`), marks the invitation `ACCEPTED` (preventing reuse), and records `INVITE_ACCEPTED` and `USER_REGISTERED` audit log entries.
- **AC-2.5**: If an invitation specifies a locked `email`, attempting to register with a different email fails validation.

## AC-3: RBAC Authorization, Account Revocation & Audit Logging
- **AC-3.1**: Unauthenticated visitors accessing protected routes (`/dashboard`, `/dashboard/settings`, `/notifications`, `/following`, `/admin`) are redirected to `/auth/login`.
- **AC-3.2**: `VIEWER` users attempting to access `/admin` or `/api/admin/*` receive `403 Forbidden`.
- **AC-3.3**: When an `ADMIN` revokes a user (`status = REVOKED`), that user can no longer log in (`账号已被停用`) and any existing session is immediately rejected on subsequent page or API requests, recording `USER_REVOKED` in `AuditLog`.
- **AC-3.4**: All invitation actions, role changes, account revocations/restorations, feedback replies, and content filter edits are recorded in `AuditLog` and visible in `/admin`.

## AC-4: Discovery, Search, Movie Detail & Multi-Source Watch
- **AC-4.1**: Typing in the home search input triggers `/api/v2/media/suggest?q=` and displays clickable autocomplete cards with poster, title, year, type, and rating.
- **AC-4.2**: `/discover` and `/discover/{movie,tv,show,cartoon,trending}` render category tabs and 5-column poster grids with Douban ratings and episode badges.
- **AC-4.3**: `/trends` switches between `24小时热搜` and `本月热搜`, highlighting ranks 1–3 and linking each keyword to `/search?kw=...`.
- **AC-4.4**: `/movie/[doubanId]` renders breadcrumbs, poster, metadata, expandable cast, Douban score, `立即播放`, `想看` toggle, `看过` modal (`1–5` star rating + short comment), TMDB stills + lightbox, Douban reviews, user short comments, multi-source episode tabs, and similar movies (`/similar/[doubanId]`).
- **AC-4.5**: `/watch/[doubanId]` and `/play/[sourceKey]/[vodId]` render the top `.watch-now-bar` with collapsible `#sourcePanelTop`, video player with Danmaku (`弹幕`) and Ad-Skip (`智能跳过广告`), anti-scam disclaimer, episode navigation (`上一集`/`当前播放`/`下一集`), `#episodesGrid`, and bottom `#sourcePanel` with latency and stability labels (`稳定`/`一般`/`较差`/`未测`).

## AC-5: Standalone Player, IPTV, TVBox & Community Features
- **AC-5.1**: `/player` plays custom `.m3u8`/`.mp4` streams via input or `?url=`, and supports `&embed=1`.
- **AC-5.2**: `/iptv` parses `#EXTINF` playlists, groups channels (`央视频道`, `卫视频道`, etc.), filters channels by keyword, and plays live streams.
- **AC-5.3**: `/tvbox` provides one-click copy for `/api/tvbox.json`, and `/api/vod` returns valid MacCMS v10 JSON for both `ac=list` and `ac=detail`.
- **AC-5.4**: `/list` and `/list/[slug]` display curated collections with 4-poster collages and numbered movie items with editorial notes.
- **AC-5.5**: `/cinema` displays `01 本周放映单`, `02 值得停一下的短评` (with working like & inline reply), and `03 片友雷达` (with working `+ 关注`).
- **AC-5.6**: `/dashboard/settings` allows updating emoji avatar, username, privacy (`isPublic`), ad-skip (`adSkipEnabled`), password, and Douban ID sync.
- **AC-5.7**: `/user/[id]` displays public profile stats, `想看`, `已看`, and `月记` (monthly watching profile with `观影重合数`).
