# Запуск golewood.ru в production

Код и тесты готовы. Ниже — порядок действий на VPS. Подробности: [DEPLOY.md](DEPLOY.md).

## Перед выкладкой (локально или на сервере)

```bash
git push -u origin main          # CI должен быть зелёным
cp deploy/.env.production.example .env
# заполнить все CHANGE_ME_* и секреты
npm run preflight:prod   # NODE_ENV=production check:prod, без ошибок
docker build -t golewood-ru:prod .     # опционально, проверка образа
```

## На сервере (по порядку)

| # | Действие | Команда / ссылка |
|---|----------|------------------|
| 1 | DNS A/AAAA на IP VPS | `golewood.ru`, `www` |
| 2 | `.env` в корне проекта | `cp deploy/.env.production.example .env` |
| 3 | Проверка env | `NODE_ENV=production npm run check:prod` |
| 4 | Старт стека + миграции | `npm run prod:up` (или `./scripts/prod-up.sh --migrate`) |
| 6 | TLS + прокси | Caddy → `127.0.0.1:3000` ([deploy/Caddyfile.example](deploy/Caddyfile.example)) |
| 7 | YooKassa webhook | `https://<domain>/api/payments/yookassa/webhook` |
| 8 | S3 для фото | `NUXT_S3_*` в `.env` |
| 9 | SMTP | `NUXT_SMTP_URL` |
| 10 | Reindex | `/admin/listings` → **Reindex** или `POST /api/admin/search/reindex` |
| 11 | Smoke | `SITE_URL=https://<domain> npm run smoke:prod` |
| 12 | Выплаты хостам | YooKassa split → `/host/payout`, `/admin/host-payouts` |

## Опционально: MAX (фазы 11–12 в PLAN.md)

- [business.max.ru](https://business.max.ru): бот, `NUXT_MAX_*`, webhook, URL мини-app `https://<domain>/max`

## После первого деплоя

- Бэкапы volume `postgres_data`
- `deploy/systemd/golewood-cron.timer` для cron, если отключены in-process jobs
- Юридические реквизиты: `NUXT_PUBLIC_OPERATOR_*` в `.env`
