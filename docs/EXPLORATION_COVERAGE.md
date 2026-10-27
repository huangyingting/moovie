# Exploration Coverage Report — Moovie 影牛 (v4.2.1)

## 1. Executive Summary

A systematic automated exploration of `https://moovie.c2v2.com/` (**Moovie 影牛 v4.2.1**) was executed using Playwright with headed Chromium (`xvfb-run` + anti-automation flags to pass Cloudflare protection) across authenticated, unauthenticated, modal, dark-mode, tablet (`768×1024`), and mobile (`390×844`) viewports.

- **Target Application**: `https://moovie.c2v2.com/` (`v4.2.1`, stylesheet `v4.3.6`, player `v5.0`)
- **Authenticated Account Used**: `.cred` (`wlfjck` / `z2351908142@gmail.com`, User ID `1162`)
- **Artifacts Captured**:
  - **49 Screenshots** in `/home/azadmin/moovie/screenshots/remote/`
  - **43 Full HTML Snapshots** in `/tmp/moovie-explore/html/`
  - **Static Assets**: `style.css` (1,682 lines), `app.js` (760+ lines), `player.js` (55 KB), `csrf.js`, `tvbox.json`, `sitemap.xml`, `manifest.json`, `sw.js`, `logo.png`, `moovie-app.png`, `placeholder.svg`

---

## 2. Route & State Coverage Matrix

| # | Route / URL | Viewport / State | Auth State | Screenshot Artifact | HTTP Status & Key Observations |
|---|---|---|---|---|---|
| 1 | `/` | Desktop `1440×900` (Light) | Authenticated | `01-home.png` | `200 OK` — Hero search box, live autocomplete (`/api/v2/media/suggest`), recent search tags, Continue Watching (`#continueWatching`), Today's Updates (`#todayUpdatesSection`), Trending strip |
| 2 | `/discover` | Desktop `1440×900` | Authenticated | `02-discover.png` | `200 OK` — 5 category tabs (`热门电影`, `热门剧集`, `热门综艺`, `热门动漫`, `本站热播`), 5-column poster grid, Douban rating badges, "新" badges |
| 3 | `/discover/tv` | Desktop `1440×900` | Authenticated | `03-discover-tv.png` | `200 OK` — Hot TV series grid with episode badges (`更新至06集`, `16集全`) and Douban ratings |
| 4 | `/discover/show` | Desktop `1440×900` | Authenticated | `04-discover-show.png` | `200 OK` — Variety shows grid (`热门综艺`) with date/episode status badges |
| 5 | `/discover/cartoon` | Desktop `1440×900` | Authenticated | `05-discover-cartoon.png` | `200 OK` — Anime/animation grid (`热门动漫`) |
| 6 | `/discover/trending` | Desktop `1440×900` | Authenticated | `06-discover-trending.png` | `200 OK` — Site-wide most-watched snapshot (`本站热播`) |
| 7 | `/trends` | Desktop `1440×900` | Authenticated | `07-trends.png` | `200 OK` — `24小时热搜` leaderboard, ranked 1–50 with `热`/`新` badges and search counts |
| 8 | `/trends?period=all` | Desktop `1440×900` | Authenticated | `08-trends-all.png` | `200 OK` — `本月热搜` monthly search leaderboard |
| 9 | `/foryou` | Desktop `1440×900` | Authenticated | `09-foryou.png` | `200 OK` — Personalized Hero movie card (`✨ 深度契合你的口味`) + `🎯 猜你喜欢` 5-col grid + HTMX pagination (`/api/htmx/foryou?page=2`) |
| 10 | `/list` | Desktop `1440×900` | Authenticated | `10-list.png` | `200 OK` — Curated film collections (`片单`) with 4-poster collage strip (`list-covers`), title, description, and film count (`10 部影片`) |
| 11 | `/cinema` | Desktop `1440×900` | Authenticated | `11-cinema.png` | `200 OK` — `MOOVIE 片友共同放映` masthead, `01 本周放映单`, `02 值得停一下的短评` (like/reply), `03 片友雷达` (`+ 关注`) |
| 12 | `/feed` | Desktop `1440×900` | Authenticated | `12-feed.png` | `200 OK` — Following activity stream (`关注动态`); shows recommended active cinephiles when following count is 0 |
| 13 | `/following` | Desktop `1440×900` | Authenticated | `27-following.png` | `200 OK` — Manage followed users (`我关注的人`) with follow/unfollow toggles |
| 14 | `/player` | Desktop `1440×900` | Authenticated | `13-player.png` | `200 OK` — Standalone M3U8/FLV/MP4 player (`Artplayer` + `hls.js` + `flv.js`), URL bar, format instructions, embed mode (`?url=...&embed=1`) |
| 15 | `/iptv` | Desktop `1440×900` | Authenticated | `23-iptv.png` | `200 OK` — Live IPTV streaming with collapsible 280px channel drawer, custom `.m3u` loader, client-side `#EXTINF` parser, grouped channels (`央视频道`, `卫视频道`, etc.), search filter |
| 16 | `/tvbox` | Desktop `1440×900` | Authenticated | `24-tvbox.png` | `200 OK` — TVBox setup guide with one-click copy of `https://<host>/api/tvbox.json` and MacCMS v10 `/api/vod` endpoint |
| 17 | `/search?kw=肖申克的救赎` | Desktop `1440×900` | Authenticated | `21-search-kw.png` | `200 OK` — `媒体库收录` structured cards with poster, rating, taxonomy tags, director, cast, summary, matched source count (`已匹配 6 个播放源`), and `立即播放 →` |
| 18 | `/search?kw=...&doubanId=1292052` | Desktop `1440×900` | Authenticated | `22-search-douban.png` | `200 OK` — Direct canonical movie detail rendering for Douban ID `1292052` |
| 19 | `/movie/26302614` | Desktop `1440×900` | Authenticated | `25-movie-detail.png` | `200 OK` — Movie detail (`请回答1988`), breadcrumb, poster, metadata, expandable cast, rating (`9.7`), `立即播放`, `想看`, `看过`, series seasons, TMDB backdrops + lightbox, Douban reviews, user short comments, multi-source list, similar movies |
| 20 | `/movie/26302614` (Modal) | Desktop `1440×900` | Authenticated | `34-mark-watched-modal.png` | `200 OK` — `标记为看过` HTMX modal with 1–5 star rating buttons (`很差`, `较差`, `还行`, `推荐`, `力荐`) and 500-char short review textarea |
| 21 | `/watch/26302614` | Desktop `1440×900` | Authenticated | `29-watch-page.png` | `200 OK` — Direct Douban watch page, top `.watch-now-bar` with collapsible `#sourcePanelTop`, Artplayer + Danmaku + Ad-skip, anti-scam disclaimer, episode nav (`上一集`/`当前播放`/`下一集`), episode grid, bottom `#sourcePanel` with latency/stability tags, action bar (`下载`, `看过`, `播放失败反馈`, `智能跳过广告`) |
| 22 | `/watch/26302614` (Top Sources) | Desktop `1440×900` | Authenticated | `35-watch-source-dropdown.png` | `200 OK` — Expanded top source switcher (`#sourcePanelTop`) showing provider list, episode variant, load speed (`0.6s`), and stability badge (`稳定`/`一般`/`较差`/`未测`) |
| 23 | `/play/[sourceKey]/[vodId]` | Desktop `1440×900` | Authenticated | `36-play-page.png` | `200 OK` — Specific provider VOD playback reusing the unified watch template |
| 24 | `/similar/26302614` | Desktop `1440×900` | Authenticated | `30-similar-page.png` | `200 OK` — Full similar recommendations list with recommendation reasons (`同属剧情 / 喜剧 / 爱情类型`) |
| 25 | `/list/selected-11` | Desktop `1440×900` | Authenticated | `28-list-detail.png` | `200 OK` — Curated list detail (`深海幽闭与未知生物：水下惊悚片单`), numbered items `1..10`, editorial notes (`list-item-note`), related lists |
| 26 | `/review/925` | Desktop `1440×900` | Authenticated | `43-review-permalink.png` | `200 OK` — Standalone short review permalink (`/review/:id`) with author card, `+ 关注`, star rating, movie card, like button, and reply form/thread |
| 27 | `/user/1102` | Desktop `1440×900` | Authenticated | `26-user-profile.png` | `200 OK` — Public cinephile profile (`Serein`), emoji avatar, joined days, `+ 关注`, stats (`已看`, `想看`, `平均分`), tabs (`想看`, `已看`, `月记`) |
| 28 | `/user/1102?tab=watched` | Desktop `1440×900` | Authenticated | `31-user-watched.png` | `200 OK` — User's watched movies list with personal ratings and short comments |
| 29 | `/user/1102?tab=reports` | Desktop `1440×900` | Authenticated | `32-user-reports.png` | `200 OK` — Monthly watching profile (`本月观影侧写`), overlap counter (`观影重合数`), persona tag, top genres, longest streak |
| 30 | `/notifications` | Desktop `1440×900` | Authenticated | `19-notifications.png` | `200 OK` — Notification center (comment likes, replies, new followers) + unread count badge polling |
| 31 | `/dashboard` | Desktop `1440×900` | Authenticated | `20-dashboard.png` | `200 OK` — Personal center (`wlfjck`), emoji avatar, public badge (`公开主页`), share link copy, settings gear, 4 tabs (`在看`, `想看`, `已看`, `反馈`) |
| 32 | `/dashboard/settings` | Desktop `1440×900` | Authenticated | `33-dashboard-settings.png` | `200 OK` — 5 settings cards: Basic Info (30-emoji picker + custom emoji, username), Privacy (`is_public`), Playback (`ad_skip_enabled`), Security (password change), Data Sync (Douban ID bind/sync), plus Logout |
| 33 | `/feedback` | Desktop `1440×900` | Authenticated | `18-feedback.png` | `200 OK` — Feedback submission form (`bug`, `request`, `suggestion`, `dmca`) + filterable community feedback feed with `已处理`/`待处理` status and `管理员回复` |
| 34 | `/about` | Desktop `1440×900` | Authenticated | `12-about.png` | `200 OK` — About Moovie, iOS PWA guide (`/static/img/moovie-app.png`), contact email & X link |
| 35 | `/advertise` | Desktop `1440×900` | Authenticated | `13-advertise.png` | `200 OK` — Advertising partnership page |
| 36 | `/changelog` | Desktop `1440×900` | Authenticated | `14-changelog.png` | `200 OK` — Full version changelog (`v1.0.0` through `v4.2.1`) |
| 37 | `/dmca` | Desktop `1440×900` | Authenticated | `15-dmca.png` | `200 OK` — DMCA copyright policy and takedown instructions |
| 38 | `/privacy` | Desktop `1440×900` | Authenticated | `16-privacy.png` | `200 OK` — Privacy policy |
| 39 | `/terms` | Desktop `1440×900` | Authenticated | `17-terms.png` | `200 OK` — Terms of service |
| 40 | `/` (Dark Mode) | Desktop `1440×900` (Dark) | Authenticated | `37-home-dark.png` | `200 OK` — Warm dark gray palette (`#17181b` / `#1f2126`) with brand red (`#d46a6a`) |
| 41 | `/` (Mobile) | Mobile `390×844` | Authenticated | `38-mobile-home.png` | `200 OK` — Top `.mobile-header`, hidden sidebar, 2-column poster grid |
| 42 | `/` (Mobile Drawer) | Mobile `390×844` | Authenticated | `39-mobile-sidebar-open.png` | `200 OK` — Slide-out `.sidebar.open` with `.sidebar-overlay.active` |
| 43 | `/` (Tablet) | Tablet `768×1024` | Authenticated | `40-tablet-discover.png` | `200 OK` — Responsive breakpoint transition at `768px` |
| 44 | `/auth/login` | Desktop `1440×900` | Unauthenticated | `41-auth-login.png` | `200 OK` — `.auth-card` login form (`email`, `password`) |
| 45 | `/auth/register` | Desktop `1440×900` | Unauthenticated | `42-auth-register.png` | `200 OK` — Registration form (`email`, `code`, `username`, `password`, `is_public` checkbox) |
| 46 | `/login` (Invalid Route) | Desktop `1440×900` | Unauthenticated | `41-login.png` | `404 Not Found` — Branded 404 error page (`页面未找到`) |

---

## 3. Reverse-Engineered API & HTMX Surface

### 3.1 JSON REST Endpoints
- `GET /api/v2/media/suggest?q=<query>` — Autocomplete suggestions returning `[{ douban_id, title, year, type, rating, poster }]`.
- `POST /api/v2/history/sync` — Synchronizes client `localStorage['moovie_play_state']` playback positions with server `playback_positions`.
- `DELETE /api/v2/history/:id` — Hard-deletes a watch history / continue-watching record.
- `POST /api/v2/playback/events` — Reports playback telemetry (load latency, buffer stalls, success/failure) to update provider quality metrics.
- `GET /api/notifications/unread-count` — Polled every 60s (`hx-trigger="load, every 60s, notificationsChanged from:body"`) for the sidebar/mobile badge.
- `POST /api/notifications/read-all` & `DELETE /api/notifications/:id` — Marks all notifications read or deletes a single notification.
- `POST /api/user-movies/:doubanId/wish` — Toggles "Want to Watch" (`想看`) status.
- `POST /api/user-movies/:doubanId/watched` — Marks movie as watched (`看过`) with 1–5 star rating and short review (`comment`), creating/updating a `Comment` with permalink `/review/:id`.
- `POST /api/comments/:id/like` — Toggles like on a short review and notifies the author.
- `GET /api/comments/:id/replies` & `POST /api/comments/:id/replies` — Loads or submits replies to a short review.
- `POST /api/users/:id/follow` — Toggles follow/unfollow on a user and creates/withdraws a follow notification.
- `GET /api/danmaku?id=<doubanId>_<episode>` & `POST /api/danmaku` — Loads and submits bullet comments (`text`, `time`, `color`, `type`).
- `POST /api/ad-fingerprints/match` & `POST /api/ad-fingerprints/vote` — Matches SHA-256 M3U8 segment fingerprints against crowd-sourced consensus (`>= 5` votes, `>= 80%` confirm rate) and records user votes.
- `GET /api/tvbox.json` & `GET /api/vod` — TVBox configuration and MacCMS v10 compatible VOD catalog/search/detail JSON API (`ac=list` / `ac=detail`, `t`, `pg`, `wd`, `ids`).
- `GET /api/img?url=<encoded>` — Image proxy with referer/host validation and fallback to `/static/img/placeholder.svg`.

### 3.2 HTMX Partial Endpoints
- `GET /api/htmx/history/recent` — Renders Continue Watching cards (`#continueWatching`) with NSFW blur support (`content_filters`).
- `GET /api/htmx/history/today-updates` — Renders Today's Episode Updates (`#todayUpdatesSection`).
- `GET /api/htmx/foryou?page=<n>` — Paginated personalized movie cards.
- `GET /api/htmx/user-movie/mark-watched?douban_id=<id>&title=<title>&rating=<r>&comment=<c>` — Returns the `标记为看过` modal HTML.
- `GET /api/htmx/dashboard/tab?tab=watching|wish|watched|feedback&page=<n>` — Renders dashboard tab content.
- `POST /api/settings/avatar`, `/api/settings/username`, `/api/settings/privacy`, `/api/settings/playback`, `/api/settings/password`, `/api/settings/douban/bind`, `/api/settings/douban/unbind`, `/api/settings/douban/sync` — Settings mutation endpoints.

---

## 4. Client-Side Storage & State Keys

- `localStorage['theme']`: `'light'` | `'dark'`, synced to `document.documentElement.setAttribute('data-theme', theme)`.
- `localStorage['moovie_recentSearches']`: JSON array of up to 8 recent search terms rendered as clickable pills with individual `×` removal and `清空`.
- `localStorage['moovie_play_state']`: JSON map of `<doubanId>` / `<sourceKey>_<vodId>` playback progress (`currentTime`, `duration`, `episode`, `updatedAt`, `title`, `poster`).
- `localStorage['moovie_danmaku_enabled']`: `'1'` | `'0'` toggle state in player controls.
- `localStorage['iptv_custom_m3u']`: Custom M3U playlist URL in `/iptv`.

---

## 5. Edge Cases & Error States Observed

1. **Non-existent Route (`/login`, `/nonexistent`)**: Returns HTTP `404` with branded `.error-page` (`404 页面未找到` + `返回首页` button).
2. **Empty Following Feed (`/feed` when following 0 users)**: Gracefully renders an empty-state callout plus a recommended list of active cinephiles with `+ 关注` buttons.
3. **Unavailable Specified Source on `/watch/:doubanId?source_key=...&vod_id=...`**: Automatically falls back to the first available playback candidate for the requested episode instead of failing to render the player.
4. **Long Episode Lists (> 30 episodes)**: Episode grid collapses middle episodes and exposes an `展开全部剧集` toggle button alongside `上一集 / 当前播放 / 下一集`.
5. **Sensitive / NSFW Content Filter**: Matches keywords in `content_filters` (`is_sensitive`), excluding items from `/trends` and blurring posters in Continue Watching until clicked.
6. **Copyright Takedown Filter (`is_copyright`)**: Matches restricted titles and displays a copyright restriction notice on `/watch` rather than streaming links.

---

## 6. Multi-Feature Interactive Combination Scenarios

In addition to route-by-route exploration, 18 remote combination screenshots (`screenshots/remote/combinations/`) and 9 local E2E combination verification screenshots (`screenshots/local/combinations/`) were captured across multi-step user journeys:

1. **Homepage Search Autocomplete + Keyboard Navigation + Recent Searches + Today Updates Banner**:
   - Typing in `#searchInput` triggers `GET /api/v2/media/suggest?q=...&envelope=1`, rendering `.search-suggestion-item` cards with poster, title, year, category badge, episode status (`全76集`), and Douban rating (`★ 9.4`).
   - `ArrowDown` / `ArrowUp` cycles `.active`, `Escape` hides the dropdown and resets `activeIndex`, and `Enter` either opens the highlighted item or submits `/search?kw=...` while persisting `localStorage['moovie_recentSearches']`.
   - `#today-updates` dynamically fetches `GET /api/htmx/history/today-updates` to display ongoing series badges for watched titles.
2. **Search Page Provider Source Pills + Year Filter Combination (`/search?kw=...`)**:
   - Combines keyword search with `.source-filter-pills` (`全部来源` + per-provider filter pills) and year dropdown filtering (`#search-year-filter`).
3. **Movie Detail Cast Expansion + Backdrops Lightbox + Mark-Watched Modal (`/movie/[doubanId]`)**:
   - `<details class="movie-cast-details">` expands truncated cast lists (`展开全部 N 位演员` / `收起`).
   - Clicking `.backdrop-item` opens `#backdropLightbox.backdrop-lightbox.active` with prev/next buttons (`.lightbox-prev`, `.lightbox-next`), `#lightboxCounter`, and `ArrowLeft`/`ArrowRight`/`Escape` keyboard navigation.
   - Clicking `看过` opens `#mark-watched-modal.action-modal-overlay.active` with 5 `.score-chip` rating buttons (`1分 很差` .. `5分 力荐`) and `#watched-comment` textarea, saving a `Comment` and updating the button to `✓ 已看 · 5★`.
4. **Watch Player Multi-Feature Combinations (`/watch/[doubanId]`)**:
   - **Smart >30 Episode Folding (`COLLAPSE_THRESHOLD = 30`)**: On 76-episode *甄嬛传* (`6922792`), renders `[1..20]`, `.episode-gap` (`…`), `[active-2..active+2]`, and `[72..76]`, with `.episode-expand-btn` (`展开全部 76 集` / `收起选集`).
   - **Top Floating & Bottom Source Switchers + Failover Candidates Overlay**: `#sourceButtonTop` toggles `#sourcePanelTop`; `#triggerFailoverBtn` queries `GET /api/v2/media-units/[unitId]/playback-candidates` to display `.failover-alternatives` health-scored fallback sources.
   - **Crowd-Sourced Ad-Skip Toast (`撤销本次`) + Voting Prompt + Autoplay Circular Ring + One-Click Failure Report**: Simulates ad-skip detection with undo toast, `这是广告吗？` voting prompt (`.ad-prompt-yes` / `.ad-prompt-no`), 5s SVG ring next-episode countdown with `不再自动播放下一集` toggle, and `#reportPlaybackFailBtn` one-click failure telemetry (`POST /api/v2/playback/events` + `POST /api/feedback`).
5. **V2 Outbox Watch History Sync + Continue Watching Card Deletion (`/`)**:
   - Playback progress writes to `localStorage['moovie_play_state']` and syncs via `POST /api/v2/history/sync` (`operations: [{ op_id, action: 'upsert'|'delete', ... }]`), rendering `#continue-watching-hint` (`数据已云端同步`), `.progress-bar`, and `.watch-delete-btn` (`×`).

