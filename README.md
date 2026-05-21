# Golewood.ru

Marketplace for short-term rental housing (Sutochno.ru analog).

**Stack:** Nuxt 4 · Nitro · PostgreSQL + PostGIS · Redis · Meilisearch · Drizzle · Tailwind 4

## Quick start (development)

**One command** (Docker + `.env` + migrate + seed):

```bash
npm run bootstrap
npm run dev
```

Or step by step:

```bash
docker compose up -d
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Dev OTP code: `0000` (`NUXT_AUTH_DEV_CODE`).

For E2E: stop the dev server first, or Playwright will reuse it locally (`reuseExistingServer` when not in CI).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Unit + integration tests |
| `npm run test:e2e` | Playwright: smoke + OAuth + booking + admin + host + guest + review + content + promo + MAX + 2FA |
| `npm run lint` | ESLint |
| `npm run verify` | lint + unit tests + production build |
| `npm run verify:all` | verify + E2E (needs Docker infra + Playwright) |
| `npm run check:prod` | Validate production env vars (requires `NODE_ENV=production`) |
| `npm run smoke:prod` | POST-deploy HTTP smoke (`SITE_URL=https://…`) |
| `npm run bootstrap` | Docker + `.env` + migrate + seed (first-time local setup) |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed demo data (users, listings, bookings, reviews) |
| `npm run db:seed:cities` | Upsert ~324 Russian cities (after migrate) |
| `npm run db:seed:reset` | Remove non-demo rows, then seed |

## Demo data (`npm run db:seed`)

Idempotent seed: upserts demo users/listings, resets guest bookings/reports, reindexes Meilisearch.

| Role  | Phone        | OTP  |
|-------|--------------|------|
| Admin | +79000000001 | 0000 |
| Host  | +79000000002 | 0000 |
| Guest | +79000000003 | 0000 |

Also creates listings (published, moderation, draft), property complex **«Глэмпинг «Боровое»»** with two units, 3 bookings (pending / confirmed / completed), payments, reviews, 1 open report for admin. Guest `+79000000003` has **3500** bonus balance; demo host `+79000000002` has **5000** promo points and verified legal profile. With `SEED_E2E=1` (Playwright): gift certificate code `GW-E2E5000` for booking E2E.

### Sign-in (dev)

**Email / OAuth:** [http://localhost:3000/auth/login](http://localhost:3000/auth/login) — email OTP `0000` with `NUXT_AUTH_DEV_CODE=0000` (code in server console if `NUXT_SMTP_URL` is empty). **Phone/SMS login is off** by default.

Demo emails after seed: `admin@golewood.local`, `host@golewood.local`, `guest@golewood.local`.

In **Account** you can link or change email (OTP or magic link). Enable **2FA** (extra email code on every sign-in; requires a linked email). Magic link opens `/auth/email-callback`.

**MAX (dev):** after seed, host `maxUserId=9000000002` and guest `9000000003` — use `POST /api/auth/max/bridge-mock` with that id, or link in `/account`, then open [http://localhost:3000/max](http://localhost:3000/max). Hosts confirm bookings; guests view and cancel theirs.

### Admin login (dev)

1. Open [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
2. Email: `admin@golewood.local` (or Yandex/VK OAuth)
3. OTP: `0000`
4. Go to [http://localhost:3000/admin](http://localhost:3000/admin) or click **Admin** in the header

Sections: `/admin/listings` (moderation), `/admin/spotlight` (photo of the month), `/admin/team-badges`, `/admin/users`, `/admin/reports`.

### Content features (phase 8)

| Feature | URL | Notes |
|---------|-----|--------|
| Photo of the month | `/spotlight` | Gallery + voting; upload only for listings you booked |
| Guest stories | `/stories` | 24h TTL; photo or video (MP4/WebM/MOV); upload from listing page (guest only) |
| Host story pins | `/host/listings/:id/stories` | Show guest stories on listing |
| Team badges | `/admin/team-badges` | Catalog + assign to published listings (review badges need a blog post) |
| Blog | `/blog`, `/admin/blog` | Team reviews; required link for «Мы здесь отдыхали» / «Одобрено Golewood» |

Public APIs: `GET /api/spotlight/hero`, `GET /api/team-badges`, `GET /api/blog/posts`, `GET /api/blog/posts/:slug`, `GET /api/listings/:id/stories` (pinned only).

### Host calendar sync

On `/host/listings/:id/calendar`: block dates manually, **import** busy dates from external iCal (Avito, etc.) or **Google Calendar OAuth**, **export** Golewood bookings/blocks via secret iCal URL for other platforms.

**Auto-sync (prod):** every 6 hours on `node-server` (plugin), or `POST /api/cron/calendar-sync` with header `X-Cron-Secret: <NUXT_CRON_SECRET>` (for external schedulers). Disable in-process timer: `NUXT_CALENDAR_SYNC_CRON_ENABLED=false`.

**Promotion index (prod):** Meili `boostScore` / `cityPinScore` fields — plugin every 6h or `POST /api/cron/promotion-index` with the same `X-Cron-Secret`. Disable timer: `NUXT_PROMOTION_INDEX_CRON_ENABLED=false`.

## Production deploy (ordered)

Full guide: **[DEPLOY.md](DEPLOY.md)**. Template env: **`deploy/.env.production.example`**.

1. Copy `deploy/.env.production.example` → `.env` on the server; set secrets. **Unset** `NUXT_AUTH_DEV_CODE`; set `NUXT_YOOKASSA_MARKETPLACE_MOCK=false`.
2. `NODE_ENV=production npm run check:prod` — fix errors before deploy.
3. `docker compose -f docker-compose.prod.yml up -d --build`
4. `docker compose -f docker-compose.prod.yml exec app npm run db:migrate` (through `0048` if upgrading)
5. Caddy/nginx → `127.0.0.1:3000` (see `deploy/Caddyfile.example`)
6. **YooKassa** webhook: `{SITE_URL}/api/payments/yookassa/webhook`
7. **S3** + **SMTP** for production
8. Admin → **Reindex** search (required after catalog migrations `0046`–`0048` — see `DEPLOY.md` §6); `npm run smoke:prod` with `SITE_URL=https://…`
9. Optional **MAX**: `DEPLOY.md` § MAX

### Guest bonuses & host promotion (phases v26–v44)

| Feature | URL | Notes |
|---------|-----|--------|
| Guest bonus balance | `/account/balance` | Up to 30% of booking; reward after approved review |
| Host promo balance | `/host/promo` | Points from completed bookings (1%, max 300) |
| Promote listing | `/host/listings/:id/promote` | Highlight (badge + border) or Boost (higher in search) |

APIs: `GET /api/account/bonus`, `GET /api/host/promo`, `GET|POST /api/host/listings/:id/promotions`. Search and home cards show highlight, verified host, and boost sort.

## Production

See [DEPLOY.md](DEPLOY.md) for the full production guide.

```bash
# Build & run with Docker
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations inside app container
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

Nitro preset: `node-server`. The app listens on port `3000`.

### Environment variables

See [`.env.example`](.env.example). Key variables:

- `NUXT_DATABASE_URL` — PostgreSQL (port `5433` in local docker)
- `NUXT_REDIS_URL` — Redis
- `NUXT_MEILI_HOST` — Meilisearch
- `NUXT_JWT_SECRET` — JWT signing secret
- `NUXT_PUBLIC_SITE_URL` — public URL for SEO, payments return URL
- `NUXT_CORS_ORIGIN` — allowed CORS origin (defaults to site URL)
- `NUXT_YOOKASSA_*` — payment keys (empty = mock payments in dev)
- `NUXT_OAUTH_YANDEX_*`, `NUXT_OAUTH_VK_*` — OAuth keys (empty = mock login via `/api/auth/oauth/{provider}/mock`)
- `NUXT_SMS_RU_API_ID` — unused by default (SMS.ru not integrated in product flow)
- `NUXT_PUBLIC_SMS_AUTH_ENABLED` — phone OTP (default **off**; sign in with email or OAuth)
- `NUXT_SMS_NOTIFICATIONS_ENABLED` — booking SMS (default **off**; email + MAX instead)
- `NUXT_MAX_BOT_TOKEN`, `NUXT_MAX_WEBHOOK_SECRET`, `NUXT_PUBLIC_MAX_BOT_USERNAME` — MAX bot for host and guest alerts (see `PLAN.md` phases 11–12)
- `NUXT_MAX_NOTIFICATIONS_ENABLED` — send booking/chat notifications via MAX (default off)
- MAX mini-app (phase 12): register app URL `https://<your-domain>/max` on [business.max.ru](https://business.max.ru); link MAX in `/account` (all roles), then open the mini-app inside MAX — host dashboard + guest bookings
- `NUXT_SMTP_URL` — email webhook (empty = booking emails logged to console in dev)
- `NUXT_PUBLIC_EMAIL_AUTH_ENABLED` — email OTP sign-in
- `NUXT_CRON_SECRET` — protects `POST /api/cron/calendar-sync` and `POST /api/cron/promotion-index`
- `NUXT_CALENDAR_SYNC_CRON_ENABLED` — in-process iCal sync every 6h (default on; set `false` if using external cron only)
- `NUXT_PROMOTION_INDEX_CRON_ENABLED` — in-process Meili promotion fields sync every 6h (default on)
- `NUXT_OAUTH_GOOGLE_CLIENT_ID`, `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` — Google Calendar import for hosts (redirect URI: `{SITE_URL}/api/host/google-calendar/callback`)
- `NUXT_S3_*` — S3-compatible photo storage (empty = local `.data/uploads`)

## Git & CI

```bash
git remote add origin git@github.com:<org>/golewood.ru.git
git push -u origin main
```

On push/PR to `main`, GitHub Actions runs `npm run verify` and E2E (`SEED_E2E=1`). Requires Postgres, Redis and Meilisearch service containers (see `.github/workflows/ci.yml`).

**Production:** checklist and env vars — [`DEPLOY.md`](DEPLOY.md). After deploy: `SITE_URL=https://golewood.ru npm run smoke:prod`.

## Architecture

Monolith: Nuxt 4 pages + Nitro API in `server/`. Business logic in `server/services/`. Shared types in `shared/`.

Development plan: [`PLAN.md`](PLAN.md)

## SEO

- `/sitemap.xml` — dynamic sitemap with published listings
- `/robots.txt` — robots rules
- JSON-LD on listing pages (`LodgingBusiness`)
- Per-page meta via `useSiteSeo()`

## API protection

- Rate limiting on auth, booking and report endpoints (Redis)
- CORS for `/api/*`
- Structured request logging (JSON to stdout)

## Health check

```
GET /api/health
```

Returns `200` when PostgreSQL, Redis and Meilisearch are available.
