# MVP-запуск golewood.ru

Минимальный выкат без рекламы второстепенных фич. Полный чеклист: [LAUNCH.md](LAUNCH.md), детали: [DEPLOY.md](DEPLOY.md).

## Что включаем в MVP

| Область | Включено |
|---------|----------|
| Auth | Email OTP + OAuth (Яндекс/VK), 2FA опционально |
| Поиск и бронь | Город, даты, фильтры, комплексы (property/unit) |
| Платежи | ЮKassa live/test + webhook + **сплит 10%** |
| Хост | CRUD объявлений, календарь, выплаты `/host/payout` |
| Админ | Модерация объявлений, reindex, host payouts |
| Медиа | **S3 обязательно** |
| Почта | **SMTP обязательно** (OTP, уведомления) |

## Что можно отложить (код уже есть)

- MAX бот и мини-app `/max`
- Spotlight «фото месяца» (не блокирует главную — fallback gradient)
- Stories, покупка promo-баллов за деньги
- SMS auth / SMS-уведомления
- Google Calendar sync (iCal import/export работает)

## Быстрый старт на VPS

```bash
git clone https://github.com/html-librarian/golewood.git /opt/golewood
cd /opt/golewood

# 1. .env с секретами (локально можно сгенерировать и scp на сервер)
./scripts/setup-prod-env.sh --domain golewood.ru --force
nano .env   # YooKassa, S3, SMTP, NUXT_PUBLIC_OPERATOR_*

# 2. Проверка
npm run preflight:prod

# 3. Стек
npm run prod:up

# 4. TLS
sudo cp deploy/Caddyfile.example /etc/caddy/Caddyfile
# отредактировать домен
sudo systemctl reload caddy

# 5. Поиск
# Admin → /admin/listings → Reindex

# 6. Smoke
SITE_URL=https://golewood.ru npm run smoke:prod
```

## Обязательные интеграции (заполнить в `.env`)

```bash
# Платежи
NUXT_YOOKASSA_SHOP_ID=
NUXT_YOOKASSA_SECRET_KEY=
NUXT_YOOKASSA_MARKETPLACE_MOCK=false

# Фото (без этого — потеря при rebuild)
NUXT_S3_BUCKET=
NUXT_S3_ACCESS_KEY=
NUXT_S3_SECRET_KEY=
NUXT_S3_ENDPOINT=
NUXT_S3_PUBLIC_URL=

# Почта
NUXT_SMTP_URL=

# Юридика (/legal/requisites)
NUXT_PUBLIC_OPERATOR_LEGAL_NAME=
NUXT_PUBLIC_OPERATOR_INN=
NUXT_PUBLIC_OPERATOR_OGRN=
NUXT_PUBLIC_OPERATOR_LEGAL_ADDRESS=
```

## YooKassa (MVP)

1. Webhook: `https://golewood.ru/api/payments/yookassa/webhook`
2. В кабинете включить **Сплитование платежей**
3. Пилотный хост: `/host/payout` → админ `/admin/host-payouts` → **Подключить выплаты**
4. Тестовая бронь: оплата → webhook → статус «Оплачено»

## Бэкапы (до открытия регистрации)

```bash
sudo mkdir -p /var/backups/golewood
chmod +x deploy/backup-postgres.sh
sudo cp deploy/systemd/golewood-backup.* /etc/systemd/system/
# WorkingDirectory=/opt/golewood в service
sudo systemctl enable --now golewood-backup.timer
sudo systemctl start golewood-backup.service   # пробный dump
```

Off-site: rsync/scp дампов в другой bucket или сервер раз в сутки.

## MVP smoke (ручной, 30 мин)

- [ ] `/api/health` → `ok: true`
- [ ] Регистрация email → OTP из почты
- [ ] Поиск Москва → карточки с фото (S3 URL)
- [ ] Бронь → redirect оплаты → webhook → confirmed
- [ ] Хост подтверждает бронь, гость видит статус
- [ ] Админ: модерация нового объявления → publish → reindex → в поиске
- [ ] Хост payout active → повторная оплата со сплитом

## Staging перед prod

Рекомендуется `staging.golewood.ru` с **test** shop YooKassa и тем же S3/SMTP. Прогнать MVP smoke там, затем скопировать `.env` паттерн на prod с **новыми** секретами.

## После MVP

1. Uptime на `/api/health` (Better Stack / UptimeRobot)
2. MAX — [DEPLOY.md](DEPLOY.md) § MAX
3. Первые 3–5 хостов с онбордингом payout
4. Мониторинг логов: `docker compose -f docker-compose.prod.yml logs -f app`
