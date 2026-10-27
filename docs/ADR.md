# Architecture Decision Records (ADR) — Moovie 影牛

## ADR-001: Next.js 16 App Router Full-Stack Architecture

- **Status**: Accepted
- **Context**: The original `moovie.c2v2.com` (`v4.2.1`) is a server-rendered Go + HTMX + vanilla JS web application with a left sidebar layout, responsive mobile drawer, rich interactive movie detail/watch pages, and JSON/HTMX endpoints. We need to build a production-grade, maintainable full-stack clone using the latest stable Next.js ecosystem while preserving 100% of the visual design, UX flows, and URL routes.
- **Decision**: Use **Next.js 16 (App Router)** with React 19 Server Components (RSC) for fast initial page rendering and SEO metadata (`Movie`, `TVSeries`, `BreadcrumbList`, `ItemList`), paired with focused Client Components for interactive islands (Search Box with live autocomplete & recent searches, Artplayer HLS/M3U8/Danmaku/Ad-Skip player, IPTV M3U parser/player, Mark-Watched modal, Cinema/Review like & reply threads, and Admin console).
- **Consequences**:
  - Preserves exact URL parity (`/`, `/discover/*`, `/trends`, `/foryou`, `/list/*`, `/cinema`, `/feed`, `/following`, `/player`, `/iptv`, `/tvbox`, `/search`, `/movie/[doubanId]`, `/watch/[doubanId]`, `/play/[sourceKey]/[vodId]`, `/similar/[doubanId]`, `/review/[id]`, `/user/[id]`, `/dashboard`, `/dashboard/settings`, `/notifications`, `/feedback`, `/auth/login`, `/auth/register`, and static pages).
  - Supports both JSON API endpoints (`/api/v2/*`, `/api/vod`, `/api/tvbox.json`, `/api/danmaku`, `/api/comments/*`, `/api/users/*`, `/api/user-movies/*`, `/api/notifications/*`, `/api/ad-fingerprints/*`) and administrative endpoints (`/api/admin/*`).

---

## ADR-002: Dual-Database Strategy with Prisma 7 (SQLite Local Dev + PostgreSQL Production)

- **Status**: Accepted
- **Context**: Local development and CI/E2E testing require zero-configuration, fast local persistence, while production deployments require horizontal connection pooling and high concurrency on PostgreSQL.
- **Decision**: Use **Prisma 7** (`prisma-client-js`) with driver adapters (`@prisma/adapter-better-sqlite3` for local SQLite development via `file:./dev.db`, and `@prisma/adapter-pg` / native PostgreSQL schema configuration for production). Maintain a canonical Prisma schema (`prisma/schema.prisma` + `prisma/schema.postgresql.prisma`) and `prisma.config.ts`.
- **Consequences**:
  - Local development runs out-of-the-box with `SQLite` (`DATABASE_URL="file:./dev.db"`).
  - Production deployments target PostgreSQL via `DATABASE_URL="postgresql://..."` with full migration support.

---

## ADR-003: Auth.js / NextAuth v5 with JWT Sessions and Live Database Revocation Checks

- **Status**: Accepted
- **Context**: The application requires authentication across server-rendered pages and API routes, role-based access control (`ADMIN`, `EDITOR`, `VIEWER`), and immediate session invalidation when an administrator revokes a user account (`status = REVOKED`).
- **Decision**: Use **NextAuth v5 (`next-auth@beta`)** with the Credentials provider (`bcrypt` password verification) and JWT session strategy. On every session verification and server-side `requireAuth()` / `getCurrentUser()` helper call, re-read the user's current `role` and `status` from Prisma so that a revoked user (`status === 'REVOKED'`) is immediately denied access (`401`/`403` or redirected to `/auth/login?error=AccountRevoked`).
- **Consequences**:
  - Combines stateless JWT cookie transport with strict real-time database enforcement of account revocation and role updates.

---

## ADR-004: Invite-Only Registration & CLI-Only Admin Bootstrap (Zero Demo Accounts)

- **Status**: Accepted
- **Context**: Public open registration or pre-seeded demo credentials introduce security risks in production. Following `../Arcade/docs/NEXTAUTH_INVITE_SPEC.md`, registration must be strictly gated by single-use, expiring, revocable invitation codes, and no demo user accounts may exist in seed scripts or application code.
- **Decision**:
  1. **Zero Demo Accounts**: `prisma/seed.ts` populates rich movie catalog data, playback sources, episodes, curated lists, search trends, and public reviews attributed to non-login catalog profiles or system metadata, **never** seeding pre-configured demo login credentials.
  2. **CLI Admin Bootstrap**: Provide `npm run bootstrap:admin` (`scripts/bootstrap-admin.ts`) which creates or updates the initial `ADMIN` account using CLI flags (`--email`, `--password`, `--username`) or environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USERNAME`) and writes an `ADMIN_BOOTSTRAP` audit log entry.
  3. **Single-Use / Expiring Invitations**: Administrators generate invitation codes via `/admin` (or `POST /api/admin/invitations`) with a cryptographically random token (`mv_inv_...`), optional email lock, target role (`VIEWER`, `EDITOR`, `ADMIN`), and expiration timestamp.
  4. **Atomic Registration on `/auth/register` and `/invite/[token]`**: Registration validates that the invitation code is `PENDING`, not expired, not revoked, and matches the invited email (if bound). In a single Prisma transaction, it creates the `User`, marks the `AccountInvitation` as `ACCEPTED` (`acceptedAt`, `acceptedByUserId`), and writes an `INVITE_ACCEPTED` + `USER_REGISTERED` audit log entry.
- **Consequences**:
  - Eliminates unauthorized signups and credential stuffing via default accounts.
  - Preserves the `/auth/register` UI layout from `moovie.c2v2.com` while replacing the email OTP code field with the single-use **Invitation Code (`邀请码`)** field (and supporting `/invite/[token]` prefill links).

---

## ADR-005: Role-Based Access Control (RBAC) & Comprehensive Audit Logging

- **Status**: Accepted
- **Context**: Administrative operations (issuing/revoking invitations, changing user roles, revoking/restoring user accounts, replying to feedback, managing curated lists, configuring content filters) require fine-grained authorization and an immutable audit trail.
- **Decision**:
  - Define three roles:
    - `VIEWER`: Standard authenticated user (watch history sync, wish/watched markings, short reviews, likes, replies, follows, danmaku, ad-skip voting, feedback submission, personal settings).
    - `EDITOR`: Can create/edit/publish curated lists (`/list`), manage media metadata & content filters, and respond to user feedback.
    - `ADMIN`: Full access including user management, role assignment, account revocation/restoration, invitation lifecycle management, and viewing the security audit log (`/admin`).
  - Persist all security-sensitive and administrative events in the `AuditLog` table (`actorId`, `actorEmail`, `action`, `targetType`, `targetId`, `metadata`, `ipAddress`, `userAgent`, `createdAt`).

---

## ADR-006: 4-Tier Media Identity & Real-Time Multi-Source Playback Architecture

- **Status**: Accepted
- **Context**: As documented in Moovie v4.0.0–v4.2.1 changelog, streaming aggregation suffers from mismatched seasons/episodes if video sources are flattened into movie records.
- **Decision**: Model the catalog using:
  1. `Movie` (`doubanId`, canonical title, type `movie|tv|show|cartoon`, rating, genres, directors, actors, backdrops, synopsis, status flags).
  2. `PlaybackSource` (provider key e.g. `ffzy`, `bfzy`, `lzi`, `dytt`, `ruyi`, provider name, latency `loadSpeedMs`, stability `稳定|一般|较差|未测`, episode variant).
  3. `Episode` (episode number, title, M3U8/MP4 stream URL, air date, tied to `Movie` and `PlaybackSource`).
  4. `WatchHistory` / `PlaybackPosition` (per-user/device resume position, episode number, entry mode `watch|play`).
- **Consequences**:
  - Enables instant source switching on `/watch/[doubanId]` (both top dropdown `#sourcePanelTop` and bottom `#sourcePanel`) without losing episode context.
  - Automatically falls back to the first available source if a requested `source_key` + `vod_id` is unavailable.

---

## ADR-007: Artplayer + HLS.js + Danmaku + Crowd-Sourced Ad-Skip Engine

- **Status**: Accepted
- **Context**: Moovie's player supports HLS (`.m3u8`), FLV, and MP4 streams, real-time bullet comments (`弹幕`), automatic 5-second next-episode countdown, and crowd-sourced M3U8 ad segment skipping (`智能跳过广告`).
- **Decision**: Implement a unified `VideoPlayer` client component powered by `hls.js` and custom player controls/Artplayer-compatible UI featuring:
  - Danmaku overlay rendering + live submission (`GET/POST /api/danmaku`).
  - M3U8 `#EXT-X-DISCONTINUITY` / segment fingerprint inspection (`POST /api/ad-fingerprints/match`) with automatic skip when confirmed (`>= 5` votes, `>= 80%` ratio) or interactive toast prompt (`是广告，跳过 / 不是`) submitting to `POST /api/ad-fingerprints/vote`.
  - Automatic 5-second countdown overlay at stream end to advance to the next episode.

---

## ADR-008: Authentic Visual Replication via Original CSS Tokens & Responsive Layout

- **Status**: Accepted
- **Context**: The user requires the application to faithfully replicate `https://moovie.c2v2.com/` across light mode, dark mode, desktop, tablet, and mobile viewports.
- **Decision**: Incorporate the exact CSS custom properties, typography, component classes, and responsive media queries (`<= 1024px`, `<= 768px`, `<= 480px`) extracted from `/tmp/moovie-explore/style.css` (`1,682` lines) plus page-specific styles from `/dashboard/settings`, `/watch`, `/player`, and `/iptv`, and serve original static image assets in `public/static/img/`.
