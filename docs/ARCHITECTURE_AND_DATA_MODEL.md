# System Architecture & Data Model — Moovie 影牛 (v4.2.1)

## 1. High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Client Layer (Browser / TVBox)                        │
│  • Next.js 16 App Router Pages (SSR + Streaming RSC + Client Islands)        │
│  • Artplayer / HLS.js / FLV.js Player + Danmaku + SHA-256 Ad-Skip Detector   │
│  • IPTV Client-Side #EXTINF M3U Parser & Live HLS Streamer                   │
│  • Theme & Local Progress Sync (localStorage <-> /api/v2/history/sync)       │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ HTTPS / JSON & HTML Partials
┌───────────────────────────────────────▼──────────────────────────────────────┐
│                   Application Layer (Next.js 16 + Auth.js v5)                │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────┐  │
│  │ Auth & RBAC Guard       │  │ Media & Playback Engine │  │ Community &  │  │
│  │ • Invite-Only Admission │  │ • 4-Tier Media Identity │  │ Social Hub   │  │
│  │ • JWT + DB Revocation   │  │ • Multi-Source Fallback │  │ • Cinema     │  │
│  │ • Roles: ADMIN / EDITOR │  │ • Danmaku & Ad-Skip     │  │ • Lists      │  │
│  │   / VIEWER              │  │ • MacCMS v10 /api/vod   │  │ • Reviews    │  │
│  │ • Audit Logger          │  │ • Content Filters       │  │ • Monthly Rpt│  │
│  └─────────────────────────┘  └─────────────────────────┘  └──────────────┘  │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ Prisma 7 ORM (Driver Adapters)
┌───────────────────────────────────────▼──────────────────────────────────────┐
│                        Persistence Layer (Dual Database)                     │
│  • Local Dev / CI: SQLite (@prisma/adapter-better-sqlite3 -> file:./dev.db)  │
│  • Production:     PostgreSQL (@prisma/adapter-pg -> postgresql://...)       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Domain & Entity-Relationship Model

### 2.1 Core Entities

1. **Identity, Invite-Only Admission, RBAC & Audit (`User`, `AccountInvitation`, `AuditLog`)**
   - `User`: Stores `id`, `email` (unique), `username`, `passwordHash`, `avatar` (emoji default `🎬`), `role` (`ADMIN`, `EDITOR`, `VIEWER`), `status` (`ACTIVE`, `REVOKED`), `isPublic` (default `true`), `adSkipEnabled` (default `false`), `doubanId`, `doubanLastSyncAt`, `revokedAt`, `createdAt`, `updatedAt`.
   - `AccountInvitation`: Stores `id`, `code` (unique single-use token e.g. `mv_inv_...`), `email` (optional locked recipient email), `role` (`VIEWER`, `EDITOR`, `ADMIN`), `status` (`PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`), `expiresAt`, `invitedByUserId`, `acceptedByUserId`, `acceptedAt`, `revokedAt`, `note`, `createdAt`.
   - `AuditLog`: Immutable security log with `id`, `actorId`, `actorEmail`, `action`, `targetType`, `targetId`, `metadata` (JSON string), `ipAddress`, `userAgent`, `createdAt`.

2. **4-Tier Media Catalog & Multi-Source Playback (`Movie`, `PlaybackSource`, `Episode`, `WatchHistory`, `ContentFilter`)**
   - `Movie`: Canonical media unit keyed by `doubanId` (unique 6–9 digit string), `imdbId`, `tmdbId`, `title`, `originalTitle`, `year`, `type` (`movie`, `tv`, `show`, `cartoon`), `poster`, `backdrops` (JSON array), `rating`, `genres`, `regions`, `languages`, `directors`, `actors`, `duration`, `episodeCount`, `currentEpisode`, `airDate`, `nextAirDate`, `summary`, `aiRecommendation`, `doubanReviews` (JSON array), `seriesKey`, `seasonNumber`, `isHot`, `isTrending`, `viewCount`.
   - `PlaybackSource`: Represents a specific provider VOD item (`sourceKey` e.g. `ffzy`, `bfzy`, `lzi`, `dytt`, `ruyi`, `sourceName` e.g. `非凡资源`, `暴风资源`, `量子资源`, `电影天堂`, `如意资源`, `vodId`, `versionLabel` e.g. `HD中字` / `1080P`, `loadSpeedMs`, `stability` `稳定|一般|较差|未测`, `movieId`).
   - `Episode`: Individual playable stream (`movieId`, `sourceId`, `episodeNumber`, `title` e.g. `第01集` or `HD中字`, `playUrl` `.m3u8`/`.mp4`, `airDate`).
   - `WatchHistory`: Unified server-side playback progress (`userId`, `movieId`, `doubanId`, `episodeNumber`, `episodeTitle`, `sourceKey`, `vodId`, `currentTime`, `duration`, `entryType` `watch|play`, `updatedAt`). Unique on `(userId, movieId)`.
   - `ContentFilter`: Unified v4.2.1 content governance (`keyword` unique, `isBlocked` blocks new ingestion, `isCopyright` blocks playback with copyright notice, `isSensitive` hides from `/trends` and blurs poster in Continue Watching).

3. **Cinephile Community, Reviews, Lists & Interactions (`UserMovie`, `Comment`, `CommentLike`, `CommentReply`, `Follow`, `CuratedList`, `CuratedListItem`, `Notification`, `Feedback`, `Danmaku`, `AdFingerprint`, `AdFingerprintVote`, `SearchTrend`)**
   - `UserMovie`: Tracks a user's `status` (`wish`, `watching`, `watched`), `rating` (1–5 stars), `comment` (short review text), `watchedAt`, `createdAt`, `updatedAt`. Unique on `(userId, movieId)`.
   - `Comment`: Public short review linked to `Movie` and optional `User` (or attributed community cinephile profile `authorName`, `authorAvatar`, `authorProfileId`), `rating` (1–5), `content`, `likesCount`, `createdAt`. Accessible at `/review/[id]`.
   - `CommentLike` & `CommentReply`: Likes and threaded replies on short reviews.
   - `Follow`: Social graph (`followerId`, `followingId`, `createdAt`).
   - `CuratedList` & `CuratedListItem`: Thematic film lists (`/list/[slug]`) with `slug`, `title`, `description`, `isPublished`, `relatedSlugs`, and ordered items with editorial `note`.
   - `Notification`: Polymorphic user alerts (`userId`, `actorId`, `actorName`, `type` `like|reply|follow`, `commentId`, `movieId`, `message`, `isRead`, `createdAt`).
   - `Feedback`: User bug reports, movie requests, suggestions, and DMCA notices (`userId`, `type` `bug|request|suggestion|dmca`, `movieUrl`, `content`, `status` `pending|resolved`, `adminReply`, `repliedAt`, `createdAt`).
   - `Danmaku`: Bullet comments (`streamKey`, `userId`, `text`, `time`, `color`, `mode`, `createdAt`).
   - `AdFingerprint` & `AdFingerprintVote`: Crowd-sourced M3U8 ad segment SHA-256 fingerprints (`fingerprint`, `sourceKey`, `segmentDuration`, `confirmVotes`, `rejectVotes`, `isConfirmed`).
   - `SearchTrend`: Search keyword counters (`keyword`, `count24h`, `countAll`, `isNew`, `isHot`, `updatedAt`).

---

## 3. Dual-Database Compatibility (SQLite & PostgreSQL)

- All models use standard Prisma scalar types (`String`, `Int`, `Float`, `Boolean`, `DateTime`) compatible with both **SQLite** (`prisma/schema.prisma`) and **PostgreSQL** (`prisma/schema.postgresql.prisma`).
- JSON structures (`backdrops`, `doubanReviews`, `metadata`) are stored as serialized JSON strings with typed helper parsers so behavior is identical across SQLite and PostgreSQL.
- `src/lib/prisma.ts` dynamically selects `@prisma/adapter-better-sqlite3` when `DATABASE_URL` starts with `file:` and `@prisma/adapter-pg` when `DATABASE_URL` starts with `postgres://` or `postgresql://`.
