# Moovie 影牛 v4.2.1 — Full-Stack Clone (Next.js 16 + Auth.js + Prisma 7)

Production-ready implementation of **Moovie 影牛 v4.2.1** (`https://moovie.c2v2.com/`), featuring multi-source VOD search & aggregation, Douban Top 250 / Now Playing / Curated Lists, HLS & Danmaku player, crowd-sourced M3U8 Ad-Skip, IPTV Live TV, TVBox API, and **Invite-Only RBAC Governance** (`ADMIN`, `EDITOR`, `VIEWER`) with single-use expiring invitation codes, instant account revocation, and immutable security audit logging.

## Key Engineering Highlights

- **Zero Demo User Accounts**: `prisma/seed.ts` populates the movie/series/anime/variety catalog, multi-provider playback sources, episodes, curated lists, search trends, danmaku, ad fingerprints, and non-login community showcase profiles while keeping `User` count at **0**.
- **CLI Admin Bootstrap**: Create the initial `ADMIN` account in production or local environments via:
  ```bash
  npm run bootstrap:admin -- --email admin@example.com --username admin --password "StrongPassword123!"
  ```
- **Invite-Only Registration**: Only users holding a valid, unrevoked, non-expired single-use invitation code (`mv_inv_...`) issued by an `ADMIN` can register via `/auth/register` or `/invite/[token]`.
- **Dual Database Support**:
  - Local development: SQLite (`prisma/schema.prisma` + `@prisma/adapter-better-sqlite3`)
  - Production deployment: PostgreSQL (`prisma/schema.postgres.prisma` + `@prisma/adapter-pg`)

## Documentation Suite (`docs/`)

- [`docs/EXPLORATION_COVERAGE.md`](docs/EXPLORATION_COVERAGE.md)
- [`docs/ADR.md`](docs/ADR.md)
- [`docs/PRD.md`](docs/PRD.md)
- [`docs/SPEC.md`](docs/SPEC.md)
- [`docs/ARCHITECTURE_AND_DATA_MODEL.md`](docs/ARCHITECTURE_AND_DATA_MODEL.md)
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)
- [`docs/TASK_BACKLOG.md`](docs/TASK_BACKLOG.md)
- [`docs/ACCEPTANCE_CRITERIA.md`](docs/ACCEPTANCE_CRITERIA.md)
- [`docs/FEATURE_PARITY_MATRIX.md`](docs/FEATURE_PARITY_MATRIX.md)
