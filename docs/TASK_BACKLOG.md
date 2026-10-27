# Engineering Task Backlog — Moovie 影牛 (v4.2.1)

| ID | Category | Task Title | Priority | Dependencies | Status |
|---|---|---|---|---|---|
| **TB-01** | Exploration | Systematic Playwright exploration, 43+ screenshots & HTML/CSS/JS extraction of `moovie.c2v2.com` | P0 | None | Done |
| **TB-02** | Docs | Author Exploration Coverage, ADR, PRD, Spec, Architecture/Data Model, Plan, Backlog, Acceptance Criteria, Parity Matrix | P0 | TB-01 | Done |
| **TB-03** | Foundation | Scaffold Next.js 16 + TypeScript + Prisma 7 (`SQLite` dev + `PostgreSQL` prod) | P0 | TB-02 | Pending |
| **TB-04** | Database | Create Prisma schema, migrations, and catalog seed (`prisma/seed.ts`) with **zero demo user accounts** | P0 | TB-03 | Pending |
| **TB-05** | Security | Implement Auth.js v5 Credentials provider + live DB revocation check + RBAC helpers (`ADMIN`, `EDITOR`, `VIEWER`) | P0 | TB-04 | Pending |
| **TB-06** | Security | Implement `scripts/bootstrap-admin.ts` (`npm run bootstrap:admin`) and immutable `AuditLog` service | P0 | TB-05 | Pending |
| **TB-07** | Security | Implement Invite-Only Registration (`/auth/register`, `/invite/[token]`, `/api/auth/register`, `/api/admin/invitations`) | P0 | TB-06 | Pending |
| **TB-08** | UI Shell | Implement faithful `AppShell` (Desktop 240px sidebar, Mobile drawer, Theme toggle, Footer, Notification badge) + original `style.css` | P0 | TB-03 | Pending |
| **TB-09** | Discovery | Implement Home (`/`), Autocomplete (`/api/v2/media/suggest`), Continue Watching (`/api/v2/history/sync`), Today's Updates | P0 | TB-08 | Pending |
| **TB-10** | Discovery | Implement Discover (`/discover`, `/discover/[category]`), Trends (`/trends`), and ForYou (`/foryou`) | P0 | TB-09 | Pending |
| **TB-11** | Catalog | Implement Search (`/search`), Movie Detail (`/movie/[doubanId]`), Similar (`/similar/[doubanId]`), Review Permalink (`/review/[id]`) | P0 | TB-10 | Pending |
| **TB-12** | Playback | Implement Unified Watch/Play (`/watch/[doubanId]`, `/play/[sourceKey]/[vodId]`) with top/bottom source switchers, Danmaku & Ad-Skip | P0 | TB-11 | Pending |
| **TB-13** | Tools | Implement Standalone M3U8 Player (`/player`), Live IPTV (`/iptv`), and TVBox (`/tvbox`, `/api/tvbox.json`, `/api/vod`) | P1 | TB-12 | Pending |
| **TB-14** | Community | Implement Curated Lists (`/list`, `/list/[slug]`), Cinema (`/cinema`), Following Feed (`/feed`, `/following`) | P1 | TB-11 | Pending |
| **TB-15** | User Center | Implement Dashboard (`/dashboard`), Settings (`/dashboard/settings`), Public Profile & Monthly Report (`/user/[id]`), Notifications (`/notifications`), Feedback (`/feedback`) | P0 | TB-11 | Pending |
| **TB-16** | Admin | Implement Admin Console (`/admin`) for Invitations, Users/Roles/Revocation, Feedback Replies, Lists, Content Filters, and Audit Logs | P0 | TB-07, TB-15 | Pending |
| **TB-17** | Static & Ops | Implement `/about`, `/advertise`, `/changelog`, `/dmca`, `/privacy`, `/terms`, `/sitemap.xml`, `/ads.txt`, `/health`, `/ready`, Docker config | P1 | TB-08 | Pending |
| **TB-18** | Verification | Execute unit/integration tests and Playwright E2E tests across all routes, roles, invite flows, and viewports | P0 | TB-03..TB-17 | Pending |
