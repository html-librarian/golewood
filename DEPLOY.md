# Production deployment

Deploy golewood.ru on a **single VPS** with Docker Compose + Caddy (HTTPS). Local development: [README.md](README.md).

## Dev-only vs production

On **`NODE_ENV=production`** the following are **disabled** (routes return 404, APIs do not return `devCode`):

| Feature | Dev endpoint / behavior |
|---------|-------------------------|
| OTP `0000` | `NUXT_AUTH_DEV_CODE` — ignored even if set in `.env` |
| Mock payments | No YooKassa keys → **503**, not instant pay |
| OAuth mock login | `/api/auth/oauth/{provider}/mock` |
| MAX bridge mock | `POST /api/auth/max/bridge-mock`, mock link in account |
| Google Calendar mock | Auto mock connect without OAuth keys |
| Payout auto-activate | `NUXT_YOOKASSA_MARKETPLACE_MOCK` ignored |
| Demo seed | `npm run db:seed` exits unless `SEED_ALLOW_PRODUCTION=1` |

Client UI for dev hints (`devCode`, mock MAX) uses `import.meta.dev` — stripped from production build.

Run `NODE_ENV=production npm run check:prod` before deploy.

## Checklist (first production host)

1. [ ] DNS A/AAAA → server IP (`golewood.ru`, `www`)
2. [ ] Copy `deploy/.env.production.example` → `.env`, fill all `CHANGE_ME_*` values
3. [ ] `npm run preflight:prod` — no errors
4. [ ] `npm run prod:up` (build, start, migrate)
5. [ ] Caddy (or nginx) → `127.0.0.1:3000`, TLS certificate
6. [ ] YooKassa webhook: `https://<domain>/api/payments/yookassa/webhook`
7. [ ] S3 for listing photos (`NUXT_S3_*`)
8. [ ] SMTP for email OTP / notifications (`NUXT_SMTP_URL`)
9. [ ] Admin: login → `/admin/listings` → **Reindex** search
10. [ ] `SITE_URL=https://<domain> npm run smoke:prod`
11. [ ] Optional: MAX bot + webhook (§ MAX below — business.max.ru)

## Prerequisites

- Docker Compose v2
- Domain with HTTPS (this guide uses [Caddy](https://caddyserver.com/))
- Backup strategy for volume `postgres_data`

## 1. Environment

On the server (project root):

```bash
npm run setup:prod-env -- --domain golewood.ru
# edit .env — YooKassa, S3, SMTP, operator requisites (secrets are auto-generated)
```

Generate secrets:

```bash
openssl rand -hex 32   # POSTGRES_PASSWORD, NUXT_JWT_SECRET, NUXT_CRON_SECRET
openssl rand -hex 24   # NUXT_MEILI_API_KEY (min 16 chars for Meilisearch)
```

Validate before start:

```bash
export $(grep -v '^#' .env | xargs)   # or use dotenv-cli
NODE_ENV=production npm run check:prod
```

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | DB password (compose + `NUXT_DATABASE_URL` must match) |
| `NUXT_DATABASE_URL` | `postgresql://golewood:PASSWORD@postgres:5432/golewood` |
| `NUXT_REDIS_URL` | `redis://redis:6379` |
| `NUXT_MEILI_HOST` | `http://meilisearch:7700` |
| `NUXT_MEILI_API_KEY` | Meilisearch master key (same in compose for `meilisearch` service) |
| `NUXT_JWT_SECRET` | ≥ 32 random characters |
| `NUXT_PUBLIC_SITE_URL` | `https://golewood.ru` (HTTPS required in prod) |
| `NUXT_CRON_SECRET` | Protects `/api/cron/*` (≥ 16 chars) |
| `NUXT_AUTH_DEV_CODE` | **Must be empty** |
| `NUXT_YOOKASSA_MARKETPLACE_MOCK` | **`false`** on real host |
| `NUXT_YOOKASSA_SHOP_ID`, `NUXT_YOOKASSA_SECRET_KEY` | Live or test shop |
| `NUXT_S3_*` | Object storage for uploads (strongly recommended) |
| `NUXT_SMTP_URL` | App posts here (`http://mail-relay:8787/send` with bundled relay) |
| `SMTP_USER`, `SMTP_PASS` | Mail.ru / internet.ru mailbox + **app password** for `mail-relay` |
| `NUXT_PUBLIC_SUPPORT_EMAIL`, `NUXT_SUPPORT_EMAIL` | `support@golewood.ru` — UI, legal, contact form (not the SMTP login) |
| `NUXT_OAUTH_*` | Yandex/VK sign-in (recommended when SMS is off) |

`docker-compose.prod.yml` binds the app to **127.0.0.1:3000** only. Postgres, Redis, Meilisearch and `mail-relay` are **not** exposed to the internet.

### Email OTP (Mail.ru, internet.ru, bk.ru)

Registration and sign-in send codes via `emailService` → HTTP `POST` to `NUXT_SMTP_URL`. Production stack includes **`mail-relay`** (SMTP bridge to `smtp.mail.ru:465`).

1. Create mailbox (e.g. `golewood@internet.ru`).
2. Mail.ru → **Настройки → Безопасность → Пароли для внешних приложений** → create password (not your login password).
3. In `.env`:

```bash
NUXT_PUBLIC_EMAIL_AUTH_ENABLED=true
NUXT_SMTP_URL=http://mail-relay:8787/send
NUXT_PUBLIC_SUPPORT_EMAIL=support@golewood.ru
NUXT_SUPPORT_EMAIL=support@golewood.ru

SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=golewood@internet.ru
SMTP_PASS=<app-password>
SMTP_FROM=golewood@internet.ru
```

4. `docker compose -f docker-compose.prod.yml up -d --build` (builds `mail-relay` on first run).
5. Test from the VPS:

```bash
docker compose -f docker-compose.prod.yml exec app node -e "
fetch('http://mail-relay:8787/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'you@example.com', subject: 'Golewood test', text: 'OK' }),
}).then(r => console.log(r.status)).catch(console.error)
"
```

6. Open `https://<domain>/auth/login` → email → code arrives within a minute (check spam).

**Receiving mail** in that inbox is only for you (support, replies) — the app does not read IMAP; it only **sends** OTP and notifications.

**Hang or 502 on «Получить код»:** the app waits for `mail-relay`, relay waits for `smtp.mail.ru`. Check:

```bash
docker compose -f docker-compose.prod.yml ps mail-relay
docker compose -f docker-compose.prod.yml logs mail-relay --tail 30
# SMTP reachable from relay container (should connect in a few seconds):
docker compose -f docker-compose.prod.yml exec mail-relay node -e "
const net=require('net');const s=net.connect(465,'smtp.mail.ru',()=>{console.log('465 OK');s.end();});
s.setTimeout(8000,()=>{console.error('465 timeout');process.exit(1)});
s.on('error',e=>{console.error(e.message);process.exit(1)});
"
```

If **465 times out**, try port **587** in `.env` (`SMTP_PORT=587`, `SMTP_SECURE=false`), recreate stack. Confirm `SMTP_PASS` is a Mail.ru **app password**, not the web-login password.

**Site returns `200` + `{ email, expiresIn }` but no mail:** the API saves the OTP in Redis and sends email in the background; if `mail-relay` returns **502**, the letter never leaves the server. Always check:

```bash
docker compose -f docker-compose.prod.yml logs mail-relay --tail 20
```

Typical log lines: `Invalid login` → wrong `SMTP_PASS`; `ETIMEDOUT` / timeout → try port **587**; `535` → enable app password for `golewood@internet.ru`.

Optional: `RUN_DB_MIGRATE_ON_START=true` runs migrate on container start (otherwise run migrate manually after each release).

## 2. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
# Build context uses .dockerignore (excludes e2e, dev artifacts, docs except README)
```

## 3. Database migrations

After first deploy and after each release with new SQL:

```bash
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

## 4. HTTPS reverse proxy (Caddy)

```bash
sudo apt install caddy
sudo cp deploy/Caddyfile.example /etc/caddy/Caddyfile
# edit domain names
sudo systemctl enable --now caddy
```

Caddy obtains Let's Encrypt certificates automatically and proxies to `127.0.0.1:3000`.

## 5. Seed (optional)

Demo data is for **staging only**. Production seed is blocked unless `SEED_ALLOW_PRODUCTION=1` (intentional staging only).

```bash
# staging only:
SEED_ALLOW_PRODUCTION=1 docker compose -f docker-compose.prod.yml exec app npm run db:seed
```

## 6. Search index

After restore or first deploy without seed:

- Admin UI: `/admin/listings` → Reindex, or
- `POST /api/admin/search/reindex` with admin bearer token

**Reindex after catalog migrations** (otherwise search filters stay stale):

| Migration | What changed in Meili |
|-----------|------------------------|
| `0046_amenity_catalog_glamping` | New amenity slugs and categories |
| `0047_accommodation_types` | `accommodationTypes` filter field |
| Property / unit indexing | Merged amenities on complexes, occupancy rules |

Run **after** `db:migrate` on each release that adds or changes indexed fields:

```bash
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
# then in admin UI or:
curl -fsS -X POST "https://<domain>/api/admin/search/reindex" \
  -H "Authorization: Bearer <admin-jwt>"
```

## 7. Cron (calendar sync + promotion index)

**Default:** in-process timers every 6 hours inside the app container (`NUXT_*_CRON_ENABLED=true`).

**Optional external cron** (disable in-app timers, use systemd on the host):

```bash
# In .env:
# NUXT_CALENDAR_SYNC_CRON_ENABLED=false
# NUXT_PROMOTION_INDEX_CRON_ENABLED=false

chmod +x deploy/cron-hit.sh
sudo cp deploy/systemd/golewood-cron.* /etc/systemd/system/
# Edit golewood-cron.service: EnvironmentFile=/opt/golewood/.env
sudo systemctl enable --now golewood-cron.timer
```

## 8. Health check and smoke

```bash
curl -fsS https://golewood.ru/api/health
SITE_URL=https://golewood.ru ./scripts/post-deploy-smoke.sh
```

Returns `200` when PostgreSQL, Redis and Meilisearch are reachable.

## 9. Updates

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
# If release changed search index fields (amenities, accommodation types, property units) — reindex (§6)
SITE_URL=https://golewood.ru ./scripts/post-deploy-smoke.sh
```

## 10. CI parity

GitHub Actions on push/PR to `main`:

- **CI** — `npm run verify` + E2E + Docker build
- **Deploy** — after green CI on `main`, SSH to VPS and `./scripts/remote-deploy.sh`

### GitHub secrets (Settings → Secrets → Actions)

| Secret | Example | Purpose |
|--------|---------|---------|
| `DEPLOY_HOST` | `123.45.67.89` | VPS IP or hostname |
| `DEPLOY_USER` | `root` | SSH user |
| `DEPLOY_SSH_KEY` | private key | Deploy key (see below) |
| `DEPLOY_PATH` | `/var/opt/golewood` | Project dir on VPS (optional) |
| `DEPLOY_SITE_URL` | `https://golewood.ru` | Post-deploy smoke (optional) |
| `DEPLOY_PORT` | `22` | SSH port (optional) |

On the VPS, add the **public** deploy key to `~/.ssh/authorized_keys`. The server must have Docker, git clone, and `.env` (never committed).

First deploy is manual (`docker compose up` + `.env`). Later pushes to `main` redeploy automatically when CI passes (pulls image from GHCR — no build on VPS).

### Small VPS: OOM during `docker compose build`

Nuxt build needs ~2–4 GB RAM. **SIGKILL** on `npm run build` = out of memory.

**Option A — swap (first manual deploy):**

```bash
sudo chmod +x deploy/add-swap.sh
sudo ./deploy/add-swap.sh 4
free -h
docker compose -f docker-compose.prod.yml up -d --build
```

### Meilisearch `unhealthy` on first `up`

If Postgres/Redis are healthy but `golewood-meilisearch-1` fails, check logs:

```bash
docker compose -f docker-compose.prod.yml logs meilisearch
```

Common causes:

- **Healthcheck used `wget`** — the Meilisearch image only has `curl`. Update `docker-compose.prod.yml` from the repo and recreate: `docker compose -f docker-compose.prod.yml up -d`.
- **`NUXT_MEILI_API_KEY` missing or &lt; 16 chars** — Meilisearch refuses to start in production. Regenerate: `openssl rand -hex 24`, set in `.env`, restart.

**Option B — pull pre-built image from GitHub (recommended):**

CI pushes `ghcr.io/html-librarian/golewood:latest` on every green `main` build. On VPS:

```bash
# GitHub → Settings → Developer settings → PAT (read:packages)
export GHCR_TOKEN=ghp_...
export GOLEWOOD_USE_REGISTRY=1
echo "$GHCR_TOKEN" | docker login ghcr.io -u html-librarian --password-stdin
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d
```

Make the package **public** (GitHub repo → Packages → golewood → Change visibility) or use `GHCR_TOKEN` secret in Actions deploy.

Locally:

```bash
docker compose up -d
npm run db:migrate
npm run verify:all
```

## Volumes

- `postgres_data` — **back up regularly**
- `redis_data` — OTP, rate limits (can rebuild)
- `meilisearch_data` — can rebuild via reindex

## PostgreSQL backup (systemd)

Generate `.env` first: `npm run setup:prod-env -- --domain golewood.ru`

```bash
sudo mkdir -p /var/backups/golewood
chmod +x deploy/backup-postgres.sh
sudo cp deploy/systemd/golewood-backup.* /etc/systemd/system/
# Edit golewood-backup.service if project path is not /opt/golewood
sudo systemctl enable --now golewood-backup.timer
sudo systemctl start golewood-backup.service   # test run
ls -la /var/backups/golewood/
```

Default schedule: daily at 03:15 UTC, keep 14 days. Override: `BACKUP_DIR`, `RETAIN_DAYS` in the service file.

Copy dumps off-site (S3, second VPS) before relying on a single disk.

## Photo storage

Without S3, uploads live in the container filesystem and are **lost on rebuild**. Configure `NUXT_S3_*` for production.

## Staging with YooKassa test shop

1. Test merchant at [YooKassa](https://yookassa.ru) — test `shop_id` + secret.
2. In `.env`: `NUXT_PUBLIC_SITE_URL=https://staging.golewood.ru`, test keys, `NUXT_YOOKASSA_MARKETPLACE_MOCK=false`.
3. Webhook: `https://staging.golewood.ru/api/payments/yookassa/webhook`
4. Without keys, payments stay in **mock mode** (instant `?return=1`).

## MAX messenger and mini-app

### Environment

```bash
NUXT_MAX_BOT_TOKEN=<bot-token>
NUXT_MAX_WEBHOOK_SECRET=<random-long-secret>
NUXT_PUBLIC_MAX_BOT_USERNAME=<bot_username_without_@>
NUXT_MAX_NOTIFICATIONS_ENABLED=true
```

`NODE_ENV=production npm run check:prod` fails if notifications are on without a token.

### Webhook

```
POST https://<your-domain>/api/max/webhook
Header: X-Max-Bot-Api-Secret: <NUXT_MAX_WEBHOOK_SECRET>
```

### Mini-app URL

Register in [business.max.ru](https://business.max.ru):

```
https://<your-domain>/max
```

Same `NUXT_MAX_BOT_TOKEN` as notifications. Users link MAX in `/account` (code `GW-*`), then open the mini-app.

## Host payouts and split (phase 14)

1. In YooKassa enable **Сплитование платежей** for your platform shop; onboard each host as a recipient and note their `account_id`.
2. Production `.env`: `NUXT_YOOKASSA_SHOP_ID`, `NUXT_YOOKASSA_SECRET_KEY`, `NUXT_YOOKASSA_MARKETPLACE_MOCK=false`.
3. Host submits INN / account / BIK at `/host/payout` → status `pending`.
4. Admin opens `/admin/host-payouts`, pastes YooKassa `account_id`, clicks **Подключить выплаты**.
5. Guest card payments use split: host share + 10% platform fee (`transfers` in YooKassa API).

Webhook: `https://<domain>/api/payments/yookassa/webhook`

Dev only: `NUXT_YOOKASSA_MARKETPLACE_MOCK=true` auto-activates mock recipients.
