# Запуск golewood.ru в production

Код и тесты готовы. Ниже — порядок действий на VPS. Подробности: [DEPLOY.md](DEPLOY.md). **MVP-чеклист:** [LAUNCH-MVP.md](LAUNCH-MVP.md).

```bash
npm run launch:status    # что уже есть / чего не хватает
npm run launch:verify    # полная проверка перед push (опционально)
```

## Перед выкладкой (локально или на сервере)

```bash
# 0. Репозиторий на GitHub (если ещё не создан)
./scripts/github-setup.sh <org>/golewood.ru   # нужен: brew install gh && gh auth login
# или: GIT_REMOTE=git@github.com:<org>/golewood.ru.git ./scripts/git-push-main.sh

npm run setup:prod-env -- --domain golewood.ru
# или staging: npm run setup:prod-env -- --domain staging.golewood.ru
# отредактировать .env: YooKassa, S3, SMTP, NUXT_PUBLIC_OPERATOR_*
npm run preflight:prod   # NODE_ENV=production check:prod, без ошибок
docker build -t golewood-ru:prod .     # опционально, проверка образа
```

## На сервере (по порядку)

| # | Действие | Команда / ссылка |
|---|----------|------------------|
| 1 | DNS A/AAAA на IP VPS | `golewood.ru`, `www` |
| 2 | `.env` в корне проекта | `cp deploy/.env.production.example .env` |
| 3 | Проверка env | `npm run preflight:prod` |
| 4 | Старт стека + миграции | `npm run prod:up` |
| 5 | TLS + прокси | Caddy → `127.0.0.1:3000` ([deploy/Caddyfile.example](deploy/Caddyfile.example)) |
| 6 | YooKassa webhook | `https://<domain>/api/payments/yookassa/webhook` |
| 7 | S3 для фото | `NUXT_S3_*` в `.env` |
| 8 | SMTP | `NUXT_SMTP_URL` |
| 9 | Reindex | `/admin/listings` → **Reindex** |
| 10 | Smoke | `SITE_URL=https://<domain> npm run smoke:prod` |
| 11 | Выплаты хостам | YooKassa split → `/host/payout`, `/admin/host-payouts` |

Проверить готовность локально: `npm run launch:status`

## Опционально: MAX (фазы 11–12 в PLAN.md)

- [business.max.ru](https://business.max.ru): бот, `NUXT_MAX_*`, webhook, URL мини-app `https://<domain>/max`

## После первого деплоя

- Бэкапы volume `postgres_data`
- `deploy/systemd/golewood-cron.timer` для cron, если отключены in-process jobs
- Юридические реквизиты: `NUXT_PUBLIC_OPERATOR_*` в `.env`
