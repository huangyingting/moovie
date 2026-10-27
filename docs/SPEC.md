# Technical Specification (SPEC) — Moovie 影牛 (v4.2.1)

## 1. Design System & Theme Specification

### 1.1 CSS Custom Properties (`data-theme="light"` & `data-theme="dark"`)
Extracted directly from `https://moovie.c2v2.com/static/css/style.css?v=4.3.6`:

| Token | Light Mode (`:root`) | Dark Mode (`[data-theme="dark"]`) | Purpose |
|---|---|---|---|
| `--bg` | `#ffffff` | `#17181b` | Primary page background |
| `--bg-secondary` | `#f7f6f3` | `#1f2126` | Sidebar, cards, secondary panels |
| `--bg-hover` | `#efedea` | `#2a2d33` | Interactive hover surface |
| `--text` | `#37352f` | `#e5e2dc` | Primary body typography |
| `--text-secondary` | `#787774` | `#9e9b95` | Metadata, subtitles, secondary labels |
| `--text-muted` | `#9b9a97` | `#6f6d68` | Timestamps, placeholders, footer notes |
| `--border` | `#e9e9e7` | `#2b2e35` | Hairline borders and dividers |
| `--accent` | `#cc5656` | `#d46a6a` | Brand accent red |
| `--accent-light` | `#f9ebeb` | `#2b1e20` | Active nav item & tag background |
| `--accent-solid` | `#c24b4f` | `#c9575b` | Primary solid CTA buttons |
| `--accent-solid-hover` | `#b64047` | `#d46468` | Primary solid CTA hover |
| `--green` / `--green-bg` | `#0f7b6c` / `#dbeddb` | `#4dab9a` / `#1b2c29` | Stability `稳定`, resolved badges |
| `--yellow` / `--yellow-bg` | `#dfab01` / `#fbf3db` | `#d4a72c` / `#30291b` | Ratings (`#f5a623`), `一般` stability |
| `--red` / `--red-bg` | `#e03e3e` / `#fbe4e4` | `#e06c6c` / `#332022` | Error banners, `较差` stability, danger buttons |
| `--sidebar-width` | `240px` | `240px` | Fixed desktop left navigation width |
| `--content-max-width` | `900px` | `900px` | Standard `.content-wrapper` max width (`1200px`/`100%` for `.full-width`) |

### 1.2 Responsive Breakpoints
- **Desktop (`> 1024px`)**: Fixed `240px` `.sidebar` on left, `.main-content` offset by `margin-left: 240px`, 5-column `.movie-grid`.
- **Tablet (`769px – 1024px`)**: Fixed `240px` `.sidebar`, 4-column `.movie-grid`, compact 2-column `.source-list`.
- **Mobile (`<= 768px`)**:
  - `.sidebar` hidden off-canvas (`transform: translateX(-100%)`), toggled via `.hamburger` button (`#mobile-menu-button`) with `.sidebar.open` and `.sidebar-overlay.active`.
  - Sticky `.mobile-header` (`height: 52px`) displaying hamburger menu, logo (`Moovie 影牛`), notification bell with unread badge, user profile icon, and theme toggle.
  - `.movie-grid` switches to `repeat(3, 1fr)` (and `repeat(2, 1fr)` at `<= 480px`).
  - `.watch-now-bar` stacks `.watch-now-source` on its own full-width row; `.source-list` becomes 1-column.

---

## 2. Route & Page Specifications

### 2.1 Public & Discovery Routes
1. **`GET /` (Home)**
   - Hero section: `.logo-large`, `.tagline` (`免费在线观看电影、剧集、综艺、动漫`), `.search-box` form (`action="/search"`) with `#searchInput` (`name="kw"`), live `#searchSuggestions` dropdown (`GET /api/v2/media/suggest?q=`), and `#recentSearches` pills (`localStorage['moovie_recentSearches']`).
   - `#todayUpdatesSection`: Today's airing episodes for series the user is currently watching.
   - `#continueWatching`: User's recent playback progress cards with resume link (`/watch/[doubanId]?ep=X`), progress bar, delete `×` button (`DELETE /api/v2/history/:id`), and NSFW blur filter (`isSensitive`).
   - `#homeRecommendations`: Curated hot movies & TV series preview with `查看更多 →` link to `/discover`.
2. **`GET /discover` & `/discover/[category]` (`movie`, `tv`, `show`, `cartoon`, `trending`)**
   - Category tab bar (`.category-tabs > .tab-btn`).
   - `.movie-grid` rendering `.movie-card` items (`poster`, `rating-badge`, `episode-badge`, `new-badge`, `title`, `year`).
3. **`GET /trends` (`?period=24h|all`)**
   - Period tabs (`24小时热搜`, `本月热搜`).
   - Ranked `.trend-list` (`1..N`) with `.trend-rank.top-1|top-2|top-3`, keyword link to `/search?kw=...`, `热`/`新` badges, and search volume count.
4. **`GET /foryou`**
   - `.foryou-hero` card featuring a top-affinity movie with backdrop/poster, genres, rating, AI recommendation reason (`✨ 深度契合你的口味`), and `立即观看` / `查看详情` buttons.
   - `🎯 猜你喜欢` 5-column grid + `加载更多推荐` button (`GET /api/htmx/foryou?page=N`).
5. **`GET /list` & `GET /list/[slug]`**
   - `/list`: Grid of `.list-card` items, each with `.list-covers` (up to 4 poster thumbnails in a horizontal collage), title, summary, and film count (`X 部影片`).
   - `/list/[slug]`: Breadcrumb (`片单 / <Title>`), header with lead editorial intro, numbered `.list-movie-item` cards (`1..N`) with poster, rating, metadata, editorial recommendation note (`.list-item-note`), `立即观看` / `详情` links, and `继续看片单` related lists section.
6. **`GET /cinema`**
   - Editorial masthead (`MOOVIE 片友共同放映`, week date range, tagline `不是算法推给你的，是活人正在看的`).
   - `01 本周放映单`: Grid of movies watched/being watched by users this week, showing viewer count (`X 位片友看过`) and star average.
   - `02 值得停一下的短评`: 2-column grid of featured short reviews with movie title/year, star rating, review text, author avatar/link, permalink timestamp (`/review/[id]`), like toggle (`POST /api/comments/:id/like`), and expandable inline reply box (`GET/POST /api/comments/:id/replies`).
   - `03 片友雷达`: Active cinephiles card grid showing avatar, username, stats (`看过 X 部 · 写过 Y 条短评`), recent watched titles, and `+ 关注` / `已关注` toggle (`POST /api/users/:id/follow`).
7. **`GET /feed` & `GET /following`**
   - `/feed`: Chronological activity cards of followed users (`标记看过`, `标记想看`, star rating, short review, movie poster card). When following 0 users, displays an empty state plus recommended active cinephiles.
   - `/following`: List of users currently followed by the logged-in user with `已关注` / `取消关注` buttons.

### 2.2 Media & Playback Routes
8. **`GET /search` (`?kw=...&year=...&doubanId=...`)**
   - When `doubanId` is provided and matches a canonical movie, renders or redirects to `/movie/[doubanId]`.
   - Otherwise renders `.search-page` with search bar, year filter chips, and `媒体库收录` `.douban-card` items (poster, `豆瓣收录` badge, title, year, type badge, Douban rating, taxonomy tags, director, cast, plot summary, `已匹配 X 个播放源`, and `立即播放 →` / `查看详情`).
9. **`GET /movie/[doubanId]` & `GET /similar/[doubanId]` & `GET /review/[id]`**
   - `/movie/[doubanId]`: Full canonical detail view with breadcrumbs, poster, metadata, rating block, `立即播放` (`/watch/[doubanId]`), `想看` toggle, `看过` modal trigger, social stats (`X 人看过 · Y 人想看`), season tabs (if multi-season series), TMDB stills gallery (`#backdropsSection`) with lightbox modal, Douban featured comments, user short comments with like/reply/permalink, multi-source episode tabs, and similar movies grid with `查看全部 →` (`/similar/[doubanId]`).
   - `/similar/[doubanId]`: Compact vertical list of similar titles with poster, rating, metadata, and objective similarity reason (`同属剧情 / 悬疑类型 · 同由...执导`).
   - `/review/[id]`: Standalone review page with author header (`+ 关注`), star rating, full comment text, linked movie card, like button, and reply thread.
10. **`GET /watch/[doubanId]` & `GET /play/[sourceKey]/[vodId]`**
    - Unified watch experience (`content-wrapper full-width`).
    - `.watch-now-bar`: Movie title, current episode badge, Douban rating, and `.watch-now-source` button toggling `#sourcePanelTop` (3-column provider switcher).
    - `.player-container`: HLS/MP4 video player with Danmaku bar (`弹幕开关`, text input, color selector, `发送`), Ad-Skip detector (`智能跳过广告`), and 5-second auto-next episode overlay.
    - `.play-disclaimer`: Anti-fraud warning banner.
    - `.episode-nav-bar` (`上一集`, `当前播放：第X集`, `下一集`) + `#episodesGrid` (collapses middle episodes if `> 30` with `展开全部剧集`).
    - `#sourcePanel`: Bottom 3-column provider list showing source name, version/episode label, latency (`0.5s`), and stability badge (`稳定`, `一般`, `较差`, `未测`).
    - `.watch-action-row`: `下载当前视频（第三方）`, `看过`, `播放失败反馈` (links to `/feedback?type=bug&movie_url=...`), and `智能跳过广告` toggle.
11. **`GET /player`**
    - Standalone web player accepting `.m3u8`, `.flv`, and `.mp4` URLs via input form or `?url=` query param, plus `&embed=1` full-bleed embed mode.
12. **`GET /iptv`**
    - Live TV player with 280px collapsible channel drawer, custom `.m3u` URL loader, client-side `#EXTINF` parser, channel category accordion, live search filter, and HLS playback with retry controls.
13. **`GET /tvbox`, `GET /api/tvbox.json`, `GET /api/vod`**
    - `/tvbox`: Setup instructions + copyable `https://<host>/api/tvbox.json` URL.
    - `/api/tvbox.json`: TVBox spider/sites JSON definition pointing to `/api/vod`.
    - `/api/vod`: MacCMS v10 compatible endpoint supporting `ac=list` (categories, pagination, `wd` keyword filter) and `ac=detail` (`ids` comma-separated VOD IDs with `vod_play_from` and `vod_play_url` formatted as `第01集$url#第02集$url`).

### 2.3 User, Community Support & Authentication Routes
14. **`GET /dashboard` & `GET /dashboard/settings`**
    - `/dashboard`: Authenticated user hub with 4 tabs (`在看`, `想看`, `已看`, `反馈`), share profile button, and link to `/admin` when `user.role === 'ADMIN'` or `'EDITOR'`.
    - `/dashboard/settings`: 5 settings sections (`基本信息`, `分享与隐私`, `播放设置`, `安全设置`, `数据同步`) + `退出登录`.
15. **`GET /user/[id]`**
    - Public cinephile profile with stats (`已看`, `想看`, `平均分`), `+ 关注` toggle, and 3 tabs (`想看`, `已看`, `月记` monthly watching report with overlap counter `观影重合数`). Respects user privacy (`isPublic = false` hides profile from non-owners/non-admins).
16. **`GET /notifications`**
    - Interactive notification list (`点赞了你的短评`, `回复了你的短评`, `关注了你`) with `全部标为已读` and individual `删除`.
17. **`GET /feedback`**
    - Feedback creation form (`type`: `bug|request|suggestion|dmca`, `movieUrl`, `content`) and filterable community feedback list showing `已处理`/`待处理` and `管理员回复`.
18. **`GET /auth/login`, `GET /auth/register`, `GET /invite/[token]`**
    - `/auth/login`: Email + password sign-in via Auth.js Credentials provider; checks `status !== 'REVOKED'` and writes `USER_LOGIN_SUCCESS` / `USER_LOGIN_FAILED` audit logs.
    - `/auth/register`: **Invite-Only Registration** requiring `inviteCode` (`邀请码`), `email`, `username`, `password`, and `isPublic` checkbox (`公开我的观影主页`, checked by default).
    - `/invite/[token]`: Validates invitation token and renders/redirects to `/auth/register?code=<token>&email=<lockedEmail>` with invitation status badge.
19. **`GET /admin`**
    - Protected by RBAC (`ADMIN` and `EDITOR` roles).
    - Provides management panels for **Invitations** (`AccountInvitation` issue/revoke/copy), **Users** (role assignment `ADMIN|EDITOR|VIEWER`, account revocation/restoration), **Feedback Replies**, **Curated Lists**, **Content Filters** (`content_filters` table: `isBlocked`, `isCopyright`, `isSensitive`), and **Audit Logs** (`AuditLog` viewer).
20. **Static Content Routes**: `/about`, `/advertise`, `/changelog`, `/dmca`, `/privacy`, `/terms`, `/sitemap.xml`, `/ads.txt`, `/health`, `/ready`.
