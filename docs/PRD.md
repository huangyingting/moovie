# Product Requirements Document (PRD) — Moovie 影牛 (v4.2.1 Enterprise Edition)

## 1. Product Vision & Overview

**Moovie 影牛** is a fast, ad-resilient movie, TV series, variety show, anime, and live IPTV discovery, streaming aggregation, and cinephile community platform. It combines canonical Douban/TMDB metadata, multi-provider HLS/M3U8 playback with real-time quality telemetry, bullet comments (`弹幕`), crowd-sourced ad skipping (`智能跳过广告`), curated film lists (`片单`), social cinephile features (`片场`, `关注动态`, short reviews, monthly watching reports), and TVBox compatibility—hardened with enterprise **invite-only registration**, **RBAC authorization**, **account revocation**, and **immutable audit logging**.

---

## 2. Target Personas

1. **Cinephile Viewer (`VIEWER`)**
   - Searches for movies/series, compares Douban ratings, watches streams across multiple backup lines (`线路`), sends danmaku, marks titles as `想看` (Wish) or `看过` (Watched) with 1–5 star ratings and short reviews, follows other film lovers, and tracks monthly watching habits (`月记`).
2. **Community Curator / Editor (`EDITOR`)**
   - Curates thematic film collections (`/list` & `/list/[slug]`) with editorial notes, manages media metadata & content filter rules (`禁止采集`, `版权限制`, `敏感内容`), and responds to user feedback tickets (`/feedback`).
3. **Platform Administrator (`ADMIN`)**
   - Bootstraps the platform via CLI (`npm run bootstrap:admin`), generates single-use/expiring invitation codes for new users, manages user roles (`ADMIN`, `EDITOR`, `VIEWER`), revokes or restores user accounts in real time, and audits security events via the Admin Console (`/admin`).

---

## 3. Functional Requirements by Epic

### Epic 1: Discovery, Search & Trends
- **FR-1.1 Home Page (`/`)**: Hero search bar with instant keyboard-navigable autocomplete (`/api/v2/media/suggest`), recent search tags stored in `localStorage['moovie_recentSearches']`, Continue Watching section (`继续观看`) with NSFW poster blur support, Today's Episode Updates (`今日更新`), and hot recommendations.
- **FR-1.2 Category Discovery (`/discover`, `/discover/[category]`)**: Five tabs (`热门电影`, `热门剧集`, `热门综艺`, `热门动漫`, `本站热播`) displaying responsive 5-column poster grids with Douban scores, episode badges, and `新` tags.
- **FR-1.3 Search Leaderboard (`/trends`)**: Real-time search rankings with `24小时热搜` (`?period=24h`) and `本月热搜` (`?period=all`) tabs, top-3 highlight badges, `热`/`新` tags, and search counts (excluding sensitive keywords).
- **FR-1.4 Personalized Recommendations (`/foryou`)**: Featured hero recommendation card (`✨ 深度契合你的口味`) with AI recommendation summary, followed by a paginated `🎯 猜你喜欢` grid.
- **FR-1.5 Unified Search (`/search`)**: Keyword search (`/search?kw=...`) with optional `year` and `exclude` filters, displaying `媒体库收录` structured cards with poster, rating, genres, director, cast, plot summary, matched source count (`已匹配 X 个播放源`), and `立即播放 →` CTA. Direct `/search?kw=...&doubanId=...` resolves to the movie detail view.

### Epic 2: Movie Details, Multi-Source Watch & Standalone Players
- **FR-2.1 Movie Detail (`/movie/[doubanId]`)**: Breadcrumb navigation, high-res poster, metadata table (director, expandable cast `<details>`, genre, region, runtime, air schedule, external Douban & IMDb links), Douban rating block, `立即播放` button, `想看` toggle, `看过` rating/review modal trigger, social counts (`X 人看过 · Y 人想看`), season/series navigation, TMDB stills gallery with lightbox, Douban hot reviews, site user short reviews (with like, reply, and permalink `/review/[id]`), multi-source episode panel, and similar movies grid (`/similar/[doubanId]`).
- **FR-2.2 Unified Watch & Play (`/watch/[doubanId]`, `/play/[sourceKey]/[vodId]`)**:
  - Top `.watch-now-bar` showing current title, episode, Douban rating, and clickable `当前线路` dropdown (`#sourcePanelTop`) to switch sources without scrolling.
  - HLS/MP4 video player with Danmaku overlay (`弹幕` toggle, input, color picker), crowd-sourced Ad-Skip (`智能跳过广告`), and 5-second auto-advance to next episode.
  - Anti-scam warning banner (`警惕视频中的赌博、色情及投资诈骗广告`).
  - Episode navigation bar (`上一集`, `当前播放`, `下一集`) + collapsible episode grid (`> 30` episodes collapse automatically with `展开全部剧集`).
  - Bottom 3-column `#sourcePanel` displaying provider name, version/episode tag, load latency (`0.5s`), and stability badge (`稳定`, `一般`, `较差`, `未测`).
  - Action row: `下载当前视频（第三方）`, `看过` modal button, `播放失败反馈`, and `智能跳过广告` quick toggle.
- **FR-2.3 Standalone M3U8 Player (`/player`)**: Supports pasting any `.m3u8`, `.flv`, or `.mp4` URL, `?url=` query auto-play, and `&embed=1` chromeless embed mode.
- **FR-2.4 Live IPTV (`/iptv`)**: Collapsible 280px channel sidebar, custom `.m3u` URL input (`DEFAULT_M3U_URL`), client-side `#EXTINF` playlist parser, grouped channel collapsible sections (`央视频道`, `卫视频道`, `港澳台`, `国际频道`), real-time channel search filter, and live HLS playback with error retry overlay.
- **FR-2.5 TVBox Integration (`/tvbox`, `/api/tvbox.json`, `/api/vod`)**: One-click copy of TVBox configuration URL and MacCMS v10 compatible VOD API (`ac=list`, `ac=detail`, `wd`, `t`, `pg`, `ids`).

### Epic 3: Cinephile Community, Curated Lists & Notifications
- **FR-3.1 Curated Film Lists (`/list`, `/list/[slug]`)**: 4-poster collage cards on `/list`; numbered film entries on `/list/[slug]` with editorial recommendation notes (`list-item-note`) and related lists (`继续看片单`).
- **FR-3.2 Cinema (`/cinema`)**: Weekly community showcase with `01 本周放映单` (movies watched/watching this week with viewer count and average stars), `02 值得停一下的短评` (featured short reviews with likes and inline replies), and `03 片友雷达` (active users with watched count, review count, recent movies, and `+ 关注` button).
- **FR-3.3 Following Feed (`/feed`, `/following`)**: Chronological activity stream of followed users' `想看` and `看过` marks and reviews; suggests active cinephiles when following zero users.
- **FR-3.4 Review Permalinks (`/review/[id]`)**: Dedicated shareable page for each user short review with movie card, author follow button, star rating, like button, and reply thread.
- **FR-3.5 Notifications (`/notifications`)**: Aggregated notifications for new followers, review likes, and review replies, with unread badge polling (`/api/notifications/unread-count`), `全部已读`, and single-item hard deletion.

### Epic 4: User Center, Public Profiles, Monthly Reports & Feedback
- **FR-4.1 Personal Dashboard (`/dashboard`)**: User profile header (emoji avatar, username, join date, `公开主页` badge, `分享主页` clipboard button, settings icon) and 4 tabs (`在看`, `想看`, `已看`, `反馈`).
- **FR-4.2 Account Settings (`/dashboard/settings`)**:
  - Basic Info: 30 preset emojis + custom emoji avatar input, username update, email & join date display.
  - Privacy: `公开我的观影主页` toggle (`isPublic`) and shareable profile URL.
  - Playback: `智能跳过广告` toggle (`adSkipEnabled`).
  - Security: Password change (`current_password`, `new_password`, `confirm_password`).
  - Data Sync: Bind/unbind Douban ID and trigger manual watch history sync.
- **FR-4.3 Public User Profile & Monthly Report (`/user/[id]`)**: Public view with emoji avatar, `+ 关注` button, stats (`已看`, `想看`, `平均分`), and tabs (`想看`, `已看`, `月记` showing monthly watching persona, longest streak, genre distribution, and movie overlap count `观影重合数` with the viewer).
- **FR-4.4 Feedback Center (`/feedback`)**: Submit feedback (`Bug 报告`, `求片`, `功能建议`, `版权投诉`, optional `movie_url`, `content`) and browse filterable community feedback with status badges (`已处理` / `待处理`) and administrator replies (`管理员回复`).

### Epic 5: Enterprise Security — Invite-Only Registration, RBAC, Revocation & Audit Logging
- **FR-5.1 Invite-Only Registration (`/auth/register`, `/invite/[token]`)**:
  - Registration requires a valid, unredeemed, non-expired, non-revoked invitation code (`邀请码`).
  - If an invitation is locked to a specific email address, registration only succeeds for that email.
  - Redeeming an invitation atomically creates the user with the assigned role (`VIEWER`, `EDITOR`, or `ADMIN`), marks the invitation `ACCEPTED`, and logs the event.
- **FR-5.2 CLI Admin Bootstrap (`npm run bootstrap:admin`)**:
  - Creates or updates the initial `ADMIN` user from CLI arguments or environment variables.
  - No demo users or default credentials are created by database migrations or seed scripts.
- **FR-5.3 Account Revocation & Role Enforcement**:
  - Admins can change user roles or revoke/restore user accounts (`ACTIVE` / `REVOKED`).
  - Revoked accounts cannot sign in and any active session is immediately rejected on the next request.
- **FR-5.4 Admin Console (`/admin`)**:
  - **Invitations Tab**: Generate new single-use invitation codes (with optional email lock, role, expiry hours), copy invite code or `/invite/[token]` link, revoke pending invitations.
  - **Users Tab**: View registered users (ordered newest first), change role (`VIEWER` / `EDITOR` / `ADMIN`), revoke or restore access.
  - **Feedback & Lists & Filters Tab**: Reply to user feedback, create/edit curated lists, manage unified `content_filters` (`禁止采集`, `版权限制`, `敏感内容`).
  - **Audit Logs Tab**: Inspect immutable security and administrative audit logs (`AuditLog`).
