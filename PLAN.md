# План разработки golewood.ru

Маркетплейс посуточной аренды жилья (аналог Суточно.ру).

**Стек:** Nuxt 4 · Nitro (server/) · PostgreSQL + PostGIS · Redis · Meilisearch · Drizzle · ЮKassa

**Workflow:** каждый этап — проверить (lint, типы, smoke-тест) → пофиксить → отметить `[x]` в этом файле. К следующей фазе не переходить, пока текущая не закрыта.

---

## Фаза 0 — Основа ✅

- [x] Nuxt 4, Tailwind, базовые layouts (`default`, `admin`)
- [x] Страницы-заглушки (`/`, `/admin`) — папка + i18n + тесты
- [x] Правила структуры компонентов и типов
- [x] Tailwind 4 + `dark:` variant в `main.css`
- [x] `@nuxtjs/i18n` — lazy locales, `usePageI18n`, global `i18n/locales/`
- [x] `@nuxtjs/color-mode` — `class="dark"` + Tailwind `dark:*`
- [x] Vitest + `@nuxt/test-utils` — `npm test`, colocated `*.test.ts`
- [x] Docker Compose: PostgreSQL (5433), Redis, Meilisearch
- [x] Drizzle ORM + миграции (`npm run db:migrate`)
- [x] Базовые shared-типы (`User`, `Listing`, `Booking`)
- [x] ESLint — `npm run lint`

---

## Фаза 1 — Auth и пользователи ✅

**Server**
- [x] `server/services/auth.service.ts` — OTP, verify, refresh, logout
- [x] SMS-верификация телефона (Redis OTP, dev-код `0000`)
- [x] OAuth: Яндекс, VK (mock в dev; реальные ключи через `.env`)
- [x] Роли: `guest` | `host` | `admin`
- [x] Middleware: `server/middleware/auth.ts`

**App**
- [x] `app/components/form/input/` — базовый инпут
- [x] `app/components/form/phone-input/` — телефон с маской
- [x] `app/pages/auth/login/`, `register/` — папка + i18n + тесты
- [x] Composable `useAuth()`

**Shared**
- [x] `shared/types/user.ts` — User, UserRole, AuthSession
- [x] `shared/schemas/auth.ts` — Zod-схемы auth API

---

## Фаза 2 — Объявления (Listings) ✅

**Server**
- [x] CRUD объявлений (только host)
- [x] Статусы: `draft` → `moderation` → `published` → `archived`
- [x] Загрузка фото → local storage (`.data/uploads`, dev)
- [x] Геокодирование адреса → lat/lng (Nominatim)
- [x] Удобства, правила проживания, вместимость

**App**
- [x] `app/components/listing/card/` — карточка в выдаче
- [x] `app/components/listing/gallery/` — галерея фото
- [x] `app/components/listing/amenities/` — список удобств
- [x] `app/pages/listings/[id]/` — страница объекта
- [x] `app/pages/host/listings/` — управление объявлениями хозяина
- [x] Wizard создания объявления (`/host/listings/create`)

**Shared**
- [x] `shared/types/listing.ts` — Listing, Amenity, ListingStatus, labels
- [x] `shared/schemas/listing.ts` — Zod-схемы

---

## Фаза 3 — Поиск ✅

**Server**
- [x] Индексация объявлений в Meilisearch
- [x] `GET /api/search` — город, даты, гости, фильтры
- [x] PostGIS: поиск в радиусе, сортировка по расстоянию
- [x] Postgres: фильтрация по доступным датам поверх Meili

**App**
- [x] `app/components/search/bar/` — строка поиска (куда, когда, кто)
- [x] `app/components/search/filters/` — фильтры (цена, удобства, тип)
- [x] `app/components/map/pins/` — карта с пинами (MapLibre GL)
- [x] `app/pages/search/` — выдача (список + карта)
- [x] URL-sync фильтров (shareable links)

**Shared**
- [x] `shared/types/search.ts` — SearchParams, SearchResult
- [x] `shared/schemas/search.ts` — Zod-схема query

---

## Фаза 4 — Календарь и бронирование ✅

**Server**
- [x] `server/services/calendar.service.ts` — доступность, min nights, блокировки
- [x] `server/services/booking.service.ts` — создание, подтверждение, отмена
- [x] Redis lock на диапазон дат (защита от двойной брони)
- [x] Idempotency keys на `POST /api/bookings`
- [x] Статусы: `pending` → `confirmed` → `cancelled` → `completed`

**App**
- [x] `app/components/booking/calendar/` — выбор дат
- [x] `app/components/booking/summary/` — итог (ночи × цена)
- [x] `app/pages/bookings/` — мои бронирования (guest)
- [x] `app/pages/host/bookings/` — бронирования объектов (host)
- [x] Виджет бронирования на `/listings/[id]`

**Shared**
- [x] `shared/types/booking.ts` — Booking, BookingStatus, CalendarDay
- [x] `shared/schemas/booking.ts` — Zod-схемы
- [x] `shared/utils/dates.ts` — date helpers + тесты

---

## Фаза 5 — Платежи ✅

**Server**
- [x] Интеграция ЮKassa (создание платежа, webhook)
- [x] Холд / списание / возврат при отмене
- [x] `server/services/payment.service.ts`
- [x] Mock-режим без ключей (dev)

**App**
- [x] Страница оплаты `/bookings/[id]/pay` (redirect flow)
- [x] Статус оплаты в списке бронирований

**Shared**
- [x] `shared/types/payment.ts` — Payment, PaymentStatus

---

## Фаза 6 — Отзывы ✅

**Server**
- [x] Отзыв только после `completed` брони
- [x] Рейтинг 1–5 + текст + модерация
- [x] `server/services/review.service.ts`
- [x] `PATCH /api/bookings/[id]/complete` — завершение проживания (хост)

**App**
- [x] `app/components/review/card/`, `review/form/`
- [x] Блок отзывов на странице объявления
- [x] Модерация отзывов в `/admin`

**Shared**
- [x] `shared/types/review.ts` — Review, ReviewStatus
- [x] `shared/schemas/review.ts` — Zod-схемы

---

## Фаза 7 — Админка ✅

**App** (`layout: admin`)
- [x] Модерация объявлений (`/admin/listings`)
- [x] Управление пользователями (`/admin/users`)
- [x] Жалобы / споры (`/admin/reports`)
- [x] Навигация `AdminNav` (sidebar + mobile), dashboard `/admin` — выручка, портал, очереди

**Server**
- [x] `server/api/admin/*` — guard по роли admin (`02-admin` middleware)
- [x] `POST /api/reports` — создание жалобы пользователем
- [x] `PATCH /api/admin/users/[id]/role` — смена роли
- [x] `PATCH /api/admin/reports/[id]/status` — обработка жалоб

---

## Фаза 8 — Полировка и запуск ✅

- [x] SEO: meta, sitemap, structured data (JSON-LD)
- [x] i18n (ru — приоритет, en)
- [x] Rate limiting, CORS
- [x] Логирование, мониторинг
- [x] E2E-тесты критических flow (поиск → бронь → оплата)
- [x] Production deploy (Nuxt + Nitro preset, Dockerfile)

---

## Структура репозитория (целевая)

```
golewood.ru/
├── app/
│   ├── components/     # form/, ui/, listing/, search/, booking/...
│   ├── composables/
│   ├── layouts/
│   ├── pages/          # каждая страница: index.vue + i18n/ + index.test.ts
│   └── assets/
├── server/
│   ├── api/
│   ├── services/
│   ├── db/
│   └── middleware/
├── shared/
│   ├── types/
│   └── utils/
├── docker-compose.yml
├── drizzle/
├── PLAN.md
└── nuxt.config.ts
```

**Страница (пример):**
```
app/pages/search/
├── index.vue
├── i18n/
│   ├── ru.ts
│   └── en.ts
└── index.test.ts
```

---

## Приоритет MVP (минимум для запуска)

1. Auth по телефону
2. CRUD объявлений + фото
3. Поиск по городу / датам / гостям
4. Бронирование + ЮKassa
5. Базовые отзывы

**MVP реализован (фазы 0–8).** Демо-данные: `npm run db:seed`.

## v2 (бэклог)

- [x] OAuth: Яндекс, VK (mock в dev без ключей)
- [x] UI для подачи жалоб (`POST /api/reports` + `ReportForm`)
- [x] Playwright E2E smoke-тесты (`npm run test:e2e`)
- [x] PostGIS: колонка `location` + GIST-индекс + sync при сохранении

## v3

- [x] E2E критический flow: OTP-логин → поиск → бронь → mock-оплата
- [x] E2E OAuth mock (Яндекс, VK) — в `smoke.spec.ts`
- [x] i18n навигации в шапке (`LayoutSettingsBar`)
- [x] `globalSetup` для Playwright — `db:seed` перед E2E

## v4

- [x] Расширенный seed: bookings, payments, reviews, reports (`npm run db:seed`)
- [x] `SEED_E2E=1` — seed без броней для E2E (globalSetup)
- [x] E2E admin flow: модерация объявления + обработка жалобы
- [x] GitHub Actions CI: lint, unit, build, E2E

## v5

- [x] Фото в seed (`public/seed/*.svg`) + coverPhotoUrl в Meilisearch
- [x] `npm run db:seed:reset` — очистка non-demo данных (`SEED_RESET=1`)
- [x] i18n `ListingCard` (noPhoto, perNight)
- [x] E2E host flow: список объявлений с фото

## v6

- [x] i18n ошибок auth/booking/pay + `ListingGallery`
- [x] Главная: секция «Популярные объявления»
- [x] Seed: pending review (всегда, для модерации в админке)
- [x] E2E: фото на главной + модерация отзыва в admin flow

## v7

- [x] Admin dashboard: `GET /api/admin/stats` + счётчики на `/admin`
- [x] E2E: guest bookings — pending booking + кнопка «Оплатить»
- [x] README: вход в админку (dev)
- [x] E2E seed: минимальная guest-бронь в `SEED_E2E=1`

## v8

- [x] i18n: `ReviewForm`, `ReviewCard`, host bookings, admin listings
- [x] E2E host bookings: подтверждение pending-брони
- [x] E2E admin dashboard: stats API + счётчики на `/admin`

## v9

- [x] E2E seed: approved review + review-eligible booking в `SEED_E2E=1`
- [x] E2E guest review: отзыв после completed stay
- [x] E2E search: карточки с фото
- [x] Playwright: `reuseExistingServer` локально (не конфликтует с `npm run dev`)

## v10

- [x] `LayoutAdminNav` — навигация в admin layout (была в PLAN, отсутствовала в коде)
- [x] E2E helper `resetE2eSeed` + стабилизация guest/host bookings
- [x] E2E admin users: список demo-аккаунтов
- [x] Unit-тест `AdminStats` type

## v11

- [x] i18n `BookingSummary` (nights, em dash)
- [x] `app/error.vue` — страница ошибок с i18n
- [x] E2E: 404 listing, host complete stay, стабильный guest review
- [x] Seed: confirmed booking с прошедшим checkout для host complete

## v12

- [x] `npm run verify` — lint + unit + build одной командой
- [x] i18n `common.emDash` в listing/users
- [x] E2E: guest cancel pending booking (статус «Отменено»)
- [x] Стабилизация навигации E2E (`gotoReady` с retry)
- [x] 17/17 E2E зелёные

## v13

- [x] E2E: admin меняет роль пользователя (guest → host)
- [x] CI: `npm run verify` вместо отдельных lint/test/build
- [x] Unit-тест `updateUserRoleSchema`

## v14

- [x] i18n ошибок wizard создания объявления
- [x] Unit-тест `isAllowedPhotoExtension`
- [x] E2E: host создаёт объявление с загрузкой фото
- [x] E2E: guest после повышения админом создаёт объявление
- [x] Seed: очистка E2E-объявлений (`E2E %`) при `SEED_E2E=1`
- [x] 20/20 E2E зелёные

## v15

- [x] Загрузка черновика в wizard (`?id=`) + `fetchHostListingById`
- [x] SMS-сервис: console в dev + optional SMS.ru (`NUXT_SMS_RU_API_ID`)
- [x] S3-хранилище фото (optional `NUXT_S3_*`, fallback local)
- [x] E2E: host редактирует черновик
- [x] 21/21 E2E зелёные

## v16

- [x] Health check: Meilisearch в `/api/health`
- [x] UI: хост архивирует объявление (`/host/listings`)
- [x] E2E: архивация черновика
- [x] E2E: YooKassa webhook → `payment.succeeded`
- [x] E2E: стабильность auth (rate limit + `getApiToken`)
- [x] 23/23 E2E зелёные

## v17

- [x] Host restore: archived → draft (`POST /api/host/listings/:id/restore`)
- [x] E2E: восстановление объявления из архива
- [x] E2E: admin reindex search
- [x] E2E: отмена брони отменяет pending payment
- [x] 26/26 E2E зелёные

## v18

- [x] Фильтр статусов на `/host/listings` (все / активные / в архиве)
- [x] E2E: фильтр archived listings
- [x] E2E: refund при отмене confirmed-брони с succeeded payment
- [x] Seed E2E: confirmed-бронь для refund-теста
- [x] 28/28 E2E зелёные

## v19

- [x] Admin: архив объявлений + восстановление в черновик
- [x] Фильтр бронирований guest (все / предстоящие / прошедшие)
- [x] E2E: admin restore archived, guest bookings filter, webhook `refund.succeeded`
- [x] 31/31 E2E зелёные

## v20

- [x] Admin stats: `listingsArchived`
- [x] Фильтр бронирований host (все / предстоящие / прошедшие)
- [x] E2E: host bookings filter, `listingsArchived` в admin stats API
- [x] Стабилизация booking-flow (`resetE2eSeed`, `gotoReady`)
- [x] 32/32 E2E зелёные

## v21

- [x] Host dashboard `/host` + `GET /api/host/stats`
- [x] `LayoutHostNav` + layout `host` для страниц хозяина
- [x] SMS-уведомления о бронированиях (создание / подтверждение / отмена)
- [x] `DEPLOY.md` + `npm run verify:all`
- [x] E2E: host dashboard stats
- [x] 33/33 E2E зелёные

## v22

- [x] Host calendar UI: блокировка дат (`/host/listings/:id/calendar`)
- [x] API: `GET/DELETE` blocks + guest favorites (`favorites` table)
- [x] Guest favorites: toggle на listing + `/favorites`
- [x] Стабилизация `getApiToken` (retry)
- [x] E2E: host calendar block, guest favorites
- [x] 35/35 E2E зелёные

## v23

- [x] Email-уведомления (`email.service` + `users.email`, console / optional `NUXT_SMTP_URL`)
- [x] Удаление из избранного на `/favorites`
- [x] Host calendar: визуальный календарь доступности (readonly)
- [x] `loginWithOtp` retry (как `getApiToken`)
- [x] YooKassa test shop docs (`.env.example`, `DEPLOY.md`)
- [x] E2E: remove favorite
- [x] 36/36 E2E зелёные

## v24

- [x] Design system: brand palette (teal), DM Sans + Fraunces, shadows, utility classes
- [x] Header/footer redesign (`LayoutSettingsBar`, `LayoutAppFooter`)
- [x] Home hero + floating search bar variant
- [x] Auth pages: card layout, OAuth buttons
- [x] Search, filters, listing detail, bookings, favorites, host dashboard — brand styling
- [x] Host/admin layouts + nav with icons
- [x] `footer.tagline` i18n
- [x] verify ✅
- [x] E2E: host calendar `.first()` fix
- [x] E2E guest review — stale eligibility cache mitigated

## v25

- [x] Design system components: `UiBadge`, `UiEmpty`, `UiStepper`, `FormTextarea` (brand styles)
- [x] Brand sweep: gallery, calendar, review form/card, pay, error, host/admin pages (no gray/blue leftovers)
- [x] Host create wizard: `UiStepper`, `surface-card`, chips, `.form-file`
- [x] Guest review fix: `POST /api/submit-review`, `@submit-review` emit (avoid native `@submit` conflict), fetch retry for dev payload cache
- [x] `data-testid="review-success"` + stable E2E waits
- [x] verify ✅
- [x] 36/36 E2E зелёные (2 flaky: booking-flow, host-edit-draft)

## v26

- [x] `UiSkeleton` (text, title, card, avatar, button) + shimmer animation
- [x] `LayoutMobileNav` — bottom tab bar on mobile (search, bookings, favorites, host, login/admin)
- [x] Remove horizontal scroll nav from header on mobile
- [x] `ListingBookingBar` — sticky booking CTA on listing detail (mobile)
- [x] Pay page funnel: `UiStepper` (booked → payment → confirm)
- [x] Search results skeleton loading state
- [x] verify ✅
- [x] 36/36 E2E зелёные

## v27

- [x] Skeleton loading: listing detail (`ListingDetailSkeleton`), bookings, favorites
- [x] `UiEmpty` polish: brand icon container + CTA links (bookings, favorites, search, listing not found)
- [x] Listing card micro-interactions: focus ring, active scale
- [x] SEO/OG: absolute image URLs, `twitterTitle`/`twitterImage`, JSON-LD image fix
- [x] Dark mode shadows: `.dark` shadow token overrides
- [x] verify ✅
- [x] 36/36 E2E зелёные (1 flaky: admin stats API)

## v28

- [x] Page transitions (`page` fade + slide, `prefers-reduced-motion` safe)
- [x] `ListingImage` — lazy loading, shimmer placeholder, fade-in on load
- [x] `HostStatsChart` / `UiChartDonut` — breakdown on host dashboard
- [x] Host analytics: KPI 30d + `UiChartArea` (доход, брони); admin charts (брони + stacked revenue)
- [x] PWA: `manifest.webmanifest`, `favicon.svg`, apple-touch-icon
- [x] Stability: skip geocode when location unchanged; Redis timeouts + idempotency/lock fallbacks; DB connect timeout
- [x] Host edit: reactive listing load + disable page transition on create wizard
- [x] Pay page: `GET /api/bookings/:id` + client `onMounted` fetch (fixes SSR false «не найдено»)
- [x] E2E: host-edit draft ✅; booking-flow ✅ (session cookie + direct pay navigation)
- [x] verify ✅
- [x] 36/36 E2E зелёные (1 flaky: smoke login page load)

## v29

- [x] Page transitions: disable on auth (login/register), listing detail, pay (selective vs global `out-in`)
- [x] Smoke E2E: `gotoReady` for login page load
- [x] PWA: PNG icons (192/512) + `npm run icons:generate` + smoke E2E
- [x] verify ✅
- [x] 37/37 E2E зелёные

## v30

- [x] Skeleton: home featured listings, host dashboard, pay page
- [x] verify ✅
- [x] 37/37 E2E зелёные

## v31

- [x] Skeleton: host listings, host bookings
- [x] Page transitions: disable on search, host listings, host bookings
- [x] Smoke E2E: `gotoReady` + timeouts on search/unknown listing
- [x] verify ✅
- [x] 37/37 E2E зелёные

## v32

- [x] Skeleton: admin dashboard, listings, users, reports
- [x] PWA: service worker (static assets cache) + `pwa.client.ts` registration
- [x] Page transitions: disable on admin pages
- [x] Smoke E2E: service worker availability check
- [x] verify ✅
- [x] 38/38 E2E зелёные (1 flaky: smoke login page load)

## v33

- [x] DB: `cancellation_policy`, `cleaning_fee` + migration `0009_trust_layer`
- [x] Pricing: `calculateBookingPrice` (subtotal + cleaning + 12% service fee) + unit tests
- [x] Server: ratings on cards (home, search, favorites), booking `totalPrice` via pricing util
- [x] UI: `ListingCard` ★ rating, `BookingSummary` price breakdown, cancellation policy on listing detail
- [x] Public host profile: `/hosts/[id]`, `GET /api/hosts/[id]`
- [x] Seed: cleaning fees + booking totals aligned with pricing formula
- [x] i18n: `listing.reviews`, `booking.cleaningFee`, `booking.serviceFee`
- [x] E2E: smoke/home + host-flow fixes (placeholder cards)
- [x] verify ✅
- [x] 38/38 E2E зелёные (3 flaky: yandex oauth, host-edit-draft load, host-flow photo)

## v34

- [x] `calculateRefund` по политике отмены (flexible / moderate / strict) + unit tests
- [x] Частичный возврат при отмене оплаченного бронирования (`cancelOrRefundForBooking`)
- [x] `refundPreview` в API бронирований + подсказка на странице «Мои бронирования»
- [x] i18n refund hints (ru + en)
- [x] verify ✅
- [x] 38/38 E2E зелёные

## v35

- [x] Host wizard: `cleaningFee` + `cancellationPolicy` в create/edit
- [x] Zod schema + `listing.service.create` для новых полей
- [x] verify ✅
- [x] 38/38 E2E зелёные

## v36

- [x] DB: `conversations`, `messages` + migration `0010_messaging`
- [x] API: inbox, start conversation, thread, send message
- [x] UI: `/messages`, `/messages/[id]`, «Написать хосту» на объявлении
- [x] Nav: ссылка «Сообщения» (desktop + mobile)
- [x] E2E: guest → host messaging flow
- [x] verify ✅
- [x] 39/39 E2E зелёные

## v37

- [x] `guestLastReadAt` / `hostLastReadAt` + migration `0011_messaging_read`
- [x] Unread count API + badge в nav + индикатор в inbox
- [x] SMS/email уведомление о новом сообщении
- [x] «Написать хосту» на публичном профиле `/hosts/[id]`
- [x] E2E: open thread from listing, host reply + unread badge
- [x] verify ✅
- [x] 40/40 E2E зелёные

---

## Фаза 8 — Контент и доверие (v38–v40) ✅

Три независимые фичи. **Порядок внедрения:** v38 (метки команды) → v39 (фото месяца) → v40 (сторис).

### Продуктовые решения (зафиксировано)

| Фича | Правило |
|------|---------|
| **Фото месяца** | Голосуют все **залогиненные** пользователи. Загрузка только с **обязательной** привязкой к `listing_id` (опубликованное объявление). |
| **Сторис** | Создают только **гости** (`role: guest`), только для **конкретного** `listing_id`. На карточке объявления — только сторис **этого** места, если **хост** включил показ (`pin`). |
| **Метки команды** | Не фиксированный enum — **справочник меток** в админке: иконка, название, описание (ru/en). Админ создаёт метки и назначает одну на объявление. |

---

### v38 — Настраиваемые метки команды (admin) ✅

**Смысл:** команда создаёт типы меток («Мы здесь отдыхали», «Одобрено Golewood», …) с иконкой и описанием; назначает **одну** метку на объявление. Показ на карточках и `/listings/[id]`.

**Данные**
- [x] Миграция `0016_team_badges.sql` + journal
- [x] `team_badge_catalog` + `listings.team_badge_id`
- [x] Seed: `team_visited`, `team_approved`
- [x] `shared/types/team-badge.ts`, `shared/schemas/team-badge.ts`

**Server**
- [x] `team-badge.service.ts` — CRUD, assign, batch attach
- [x] `GET /api/team-badges`, admin CRUD, `GET /api/admin/listings/published`, `PATCH .../team-badge`
- [x] `teamBadge` в listing detail, search, home, favorites

**App**
- [x] `ListingTeamBadge` — иконка + title; описание на странице объявления
- [x] `SearchResultCard`, `ListingCard`, `/listings/[id]`
- [x] `/admin/team-badges` — CRUD + назначение на опубликованные объявления
- [x] nav + i18n `admin.nav.teamBadges`

**Правила**
- Только `admin` создаёт/редактирует справочник и назначает на listing
- Без `team_badge_id` — бейдж не рендерим
- Одна метка на объявление (при смене — перезапись FK)

---

### v39 — Фото месяца (hero главной) ✅

**Смысл:** вместо зелёного градиента на `/` — фоновое фото-победитель месяца. Галерея для гостей, голосование, модерация загрузок.

**Продукт (MVP)**
1. Страница `/spotlight`: сетка одобренных фото текущего конкурса + CTA «Добавить фото»
2. Загрузка: **auth обязателен**, **`listing_id` обязателен** (только `published`), опционально `caption`
3. Статусы: `pending` → `approved` | `rejected` (админ `/admin/spotlight`)
4. Голос: любой **залогиненный** пользователь; **1 голос / месяц** (`YYYY-MM`), можно сменить до закрытия
5. Закрытие месяца (cron или админ): победитель = max(votes) среди `approved` → `spotlight_months.winner_photo_id`
6. Главная: `GET /api/spotlight/hero` → фон + overlay; fallback — brand gradient

**Данные**
- [x] `spotlight_photos`: id, user_id, **listing_id NOT NULL**, image_url, caption?, status, month_key, vote_count (денорм), created_at
- [x] `spotlight_votes`: photo_id, user_id, month_key, unique(user_id, month_key)
- [x] `spotlight_months`: month_key PK, winner_photo_id, closed_at, hero_crop? (json: focal point)
- [x] Миграция `0017_spotlight.sql`

**Server**
- [x] `spotlight.service.ts` — upload, list by month, vote, tally, set winner, get hero
- [x] `POST /api/spotlight/photos`, `GET /api/spotlight/photos?month=`, `POST /api/spotlight/vote`, `GET /api/spotlight/hero`
- [x] Admin: `GET/PATCH /api/admin/spotlight/photos/:id` (approve/reject), `POST .../close-month`
- [x] Rate limit на upload/vote (Redis)
- [x] Валидация upload: listing `published`, пользователь залогинен
- [x] Антифрод: голос только за `approved` фото текущего `month_key`

**App**
- [x] `app/pages/spotlight/` — галерея + голосование
- [x] `app/pages/(home)/` — hero с `<img>` + gradient overlay + credit + ссылка на `/spotlight`
- [x] `app/pages/admin/spotlight/` — очередь модерации + кнопка закрытия месяца
- [x] `app/components/spotlight/` — card, upload form, vote button
- [x] CTA на `/listings/[id]` → `/spotlight?listingId=`

**UX / legal**
- [x] Чекбокс «Разрешаю публикацию на главной и в галерее»
- [x] Проигравшие фото остаются в архиве галереи, не на hero

---

### v40 — Сторис (как Instagram) ✅

**Смысл:** **гость** публикует сторис только с **конкретного** объявления; лента в профиле гостя; хост решает, показывать ли сторис **этого listing** на карточке.

**Продукт (MVP)**
1. TTL **24 ч** (`expires_at`, env)
2. **Создание:** только `role === 'guest'`, **`listing_id` обязателен** — UI на `/listings/[id]` («Добавить сторис») + «Мои сторис» у гостя
3. **Профиль гостя** (не хоста): кольцо активных сторис, viewer (клавиатура + touch swipe)
4. **Хост:** `/host/listings/[id]/stories` — сторис с `listing_id = этот объект` → toggle «Показать на объявлении» (`listing_story_pins`)
5. **Публично на объявлении:** только **pinned** + not expired + `story.listing_id === listing.id`

**Данные**
- [x] `user_stories`: id, user_id, **listing_id NOT NULL**, media_url, media_type (`image` в MVP), expires_at, created_at
- [x] `listing_story_pins`: listing_id, story_id, sort_order, unique(listing_id, story_id); в сервисе: pin только если `story.listing_id === listing_id`
- [x] Миграция `0018_stories.sql`
- [x] Фильтр expired при каждом read

**Server**
- [x] `story.service.ts` — create (guest + listing), list mine, list for listing (pinned only)
- [x] `POST /api/stories` — guest only; `listingId` required
- [x] `GET /api/stories/me`, `GET /api/listings/:id/stories` (pinned, non-expired)
- [x] `POST /api/host/listings/:id/stories/:storyId/pin`, `DELETE .../pin` — host owns listing; story listing match
- [x] Видео — фаза 40b

**App**
- [x] `app/components/story/` — ring, viewer (fullscreen), upload
- [x] `app/pages/listings/[id]/` — «Добавить сторис» (guest) + кольцо pinned-сторис
- [x] `app/pages/stories/` + ссылка с `/bookings` — «Мои сторис»
- [x] `app/pages/host/listings/[id]/stories/` — управление пинами

**MVP scope cut (если долго)**
- Фаза 40a: только **фото**-сторис, без видео
- Фаза 40b: видео + прогресс-бар просмотра

---

### Зависимости и риски

| Фича | Зависит от | Риск |
|------|------------|------|
| v38 | — | Низкий |
| v39 | storage, admin moderation | Накрутка голосов → rate limit + 1 vote/user/month |
| v40 | storage, transcode | Видео тяжёлое → начать с image-only |

**Не смешивать** сторис и spotlight: разные таблицы и moderation flow.

---

### Чеклист закрытия фазы 8

- [x] v38: lint, типы, smoke админ + бейдж на search/listing
- [x] v39: миграция, голосование E2E, hero на главной с fallback
- [x] v40 (40a): upload, expiry, pin на listing, viewer + touch swipe
- [x] v40b: видео-сторис + progress bar в viewer
- [x] `PLAN.md` — отметить `[x]` по подпунктам фазы 8 (кроме 40b)
- [x] colocated tests: `/spotlight`, `/stories`, admin/host stories; `spotlight-month` util

## v41

- [x] E2E `z-content-trust.spec.ts`: spotlight/team-badges/stories APIs + pages
- [x] README: phase 8 URLs + admin sections
- [x] Nav: `/spotlight` in header
- [x] verify ✅
- [x] 45/45 E2E зелёные (+5 content-trust)

## v42

- [x] Spotlight upload: select из бронирований гостя (не UUID)
- [x] Server: spotlight upload только для listing с бронью
- [x] v40b: `0019_story_video`, MP4/WebM/MOV до 50 МБ, progress bar в `StoryViewer`
- [x] `shared/utils/story-media.ts` + unit tests
- [x] verify ✅

---

## Фаза 9 — Синхронизация календарей хоста (v43)

**Проблема:** брони вне Golewood (напрямую, Avito, Суточно и др.) → нужны занятые даты и двусторонняя синхронизация.

**MVP**
- [x] Импорт iCal (HTTPS URL) → `listing_blocks` (`source: import`)
- [x] Экспорт iCal (секретная ссылка): брони + блокировки
- [x] UI `/host/listings/[id]/calendar` — подключение, sync, копирование export
- [x] Миграция `0020_calendar_sync.sql`, `shared/utils/ical.ts`

**Бэклог (v51):**
- [x] Cron iCal: `runCronSync`, plugin (6h, prod), `POST /api/cron/calendar-sync`
- [x] `npm run check:prod`, README «Production deploy (ordered)»

**Бэклог (v53):**
- [x] Клик по сетке календаря: диапазон блокировки, снятие ручного блока (`hostManage`, `GET /api/host/listings/:id/calendar`)

**Бэклог (v54):**
- [x] OAuth Google Calendar: credentials, `feed_type=google`, sync via Calendar API
- [x] API `/api/host/google-calendar/*`, UI `HostCalendarGoogle`, dev mock без ключей

**Бэклог:** —

---

## Фаза 10 — Продвижение объявлений хоста (v44)

**MVP**
- [x] `host_promo_balance`, `listing_promotions`, `host_promo_transactions` (`0028`)
- [x] Начисление 1% (макс. 300) при завершении бронирования хостом
- [x] Тарифы: Highlight (рамка + бейдж), Boost (выше в поиске)
- [x] API `/api/host/promo`, `/api/host/listings/[id]/promotions`
- [x] UI `/host/promo`, `/host/listings/[id]/promote`
- [x] Поиск: boost-сортировка, highlight/verified на карточках

**Бэклог (v52):**
- [x] Тариф `city_pin` — закрепление в поиске по городу
- [x] `partitionPromotedForSearch`, Meili `boostScore` / `cityPinScore` / `highlightScore`
- [x] Крупная карточка `ListingFeaturedHero` на главной при city pin
- [x] Cron / endpoint `POST /api/cron/promotion-index` + in-process plugin

---

## Фаза 11 — Уведомления хостов в MAX (v45)

**Цель:** дешёвая альтернатива SMS — бот MAX для броней и сообщений в чате.

**MVP**
- [x] `users.max_user_id`, `max_linked_at` (`0032_user_max_notifications.sql`)
- [x] `server/services/max.service.ts` — привязка по коду GW-*, `POST /messages`, webhook
- [x] API: `GET/DELETE /api/account/max`, `POST /api/account/max/link`, `POST /api/max/webhook`
- [x] `notificationService` → MAX для хоста (бронь, чат, новый диалог)
- [x] UI `AccountMaxNotifications` в `/account` (хост/админ)
- [x] Dev: `POST /api/account/max/mock-link`, консоль без токена

**Настройка prod** (только ops, код готов — [DEPLOY.md](DEPLOY.md) § MAX)
- [ ] Организация на [business.max.ru](https://business.max.ru), бот, токен
- [ ] `NUXT_MAX_BOT_TOKEN`, `NUXT_MAX_WEBHOOK_SECRET`, `NUXT_PUBLIC_MAX_BOT_USERNAME`
- [ ] `NUXT_MAX_NOTIFICATIONS_ENABLED=true`
- [ ] Webhook: `POST https://<site>/api/max/webhook` (HTTPS, `X-Max-Bot-Api-Secret`)

**Бэклог (v55):**
- [x] Deep link `?start=link_*` при привязке MAX, `?start=bookings` / `booking_{id}`
- [x] Inline-кнопки «Открыть бронь» (мини-app) и «На сайте» в уведомлении о новой брони

**Бэклог (v58):**
- [x] Гостевые уведомления в MAX: `sendGuestNotification`, бронь подтверждена/отменена, сообщения от хоста; кнопки «Открыть бронь» / «Мои брони»
- [x] Привязка MAX в `/account` для всех ролей (не только хост)

---

## Фаза 12 — MAX Bridge мини-приложение (v46)

**Цель:** хост открывает Golewood внутри MAX без SMS — вход по `initData`, компактный UI.

**Документация:** [MAX Bridge](https://dev.max.ru/docs/webapps/bridge), [валидация initData](https://dev.max.ru/docs/webapps/validation).

**MVP**
- [x] `shared/utils/max-init-data.ts` — HMAC-SHA256 по алгоритму MAX
- [x] `POST /api/auth/max/bridge` — вход хоста / привязка MAX к текущей сессии
- [x] `POST /api/auth/max/bridge-mock` (dev)
- [x] `useMaxBridge`, layout `max`, страницы `/max`, `/max/bookings`
- [x] SDK `https://st.max.ru/js/max-web-app.js`, BackButton на бронях

**Настройка prod** (см. [DEPLOY.md](DEPLOY.md) § MAX)
- [ ] В [business.max.ru](https://business.max.ru) указать URL мини-приложения: `https://<site>/max`
- [ ] Тот же `NUXT_MAX_BOT_TOKEN`, что у бота уведомлений
- [ ] Хост привязывает MAX в `/account` (код GW-*), затем открывает мини-приложение

**Бэклог (v55):**
- [x] `startapp=bookings` и `startapp=booking_{id}` в мини-приложении `/max`

**Бэклог (v59):**
- [x] Гостевой режим мини-приложения: вход гостя по MAX, `/max` и `/max/bookings` (просмотр и отмена)
- [x] ThemeParams / `colorScheme` → `useColorMode` + CSS-переменные `--max-*` в layout `max`
- [x] HapticFeedback: тактильный отклик на действия в бронях
- [x] «Push» в мини-app: обновление списка броней при `visibilitychange`, `WebApp.ready()`, deep link `bookings` / `booking_{id}` для гостей

---

## Фаза 13 — Каталог команды и заявки владельцев (v47)

**Цель:** объекты, добавленные командой вручную — без брони и профиля хоста; владелец может запросить передачу управления.

**MVP**
- [x] `listings.managed_by_team`, таблица `listing_claim_requests`
- [x] Публичная страница: без бронирования, форма «Запросить доступ»
- [x] `POST /api/listings/:id/claim-request`
- [x] Админка: заявки, назначение `hostUserId`, «Опубликовать как каталог команды»
- [x] `PATCH /api/admin/listings/:id/ownership`
- [x] Seed: «Двухкомнатная у Невы» — `managed_by_team`

**Бэклог (частично закрыт v48):**
- [x] Поиск хоста по телефону в админке (`GET /api/admin/users/lookup`)
- [x] Email-уведомления (админам о заявке, заявителю при approve/reject)
- [x] «Передать заявителю» — создание/повышение хоста из заявки
- [x] Бейдж «Каталог Golewood» в карточках поиска
- [x] Вход и регистрация по email OTP (`/api/auth/send-email-code`, `verify-email`)

**Бэклог (v49):**
- [x] Привязка email в `/account` (`POST/DELETE /api/account/email/*`)
- [x] Вход по email + телефон из существующего аккаунта (`linkPhone` на verify-email)
- [x] Фильтр «Только каталог Golewood» в поиске (`teamCatalog`, Meilisearch `managedByTeam`)

**Бэклог (v50):**
- [x] Magic link в письмах (вход + привязка email), `/auth/email-callback`
- [x] `POST /api/auth/email/magic`
- [x] Смена телефона в `/account` (`POST /api/account/phone/*`)

**Бэклог (v53):**
- [x] Отзыв сессий: `GET/DELETE /api/account/sessions`, `POST revoke-others`, UI `AccountSessions`

**Бэклог (v56):**
- [x] Смена телефона с подтверждением текущего номера: `GET change-status`, `POST send-old-code` / `verify-old-code`, флаг Redis `change-phone:old-verified`, UI шаг `current` → `phone` → `code` (пропуск для synthetic `+7999…`)

**Бэклог (v57):**
- [x] 2FA по email при входе по телефону: `users.two_factor_enabled`, `POST /api/auth/verify-mfa`, `GET/POST /api/account/two-factor/*`, UI `AccountTwoFactor`, шаг MFA на `/auth/login`

**Бэклог (v60):**
- [x] Seed: `maxUserId` для demo host/guest (bridge-mock в dev)
- [x] E2E `z-max-bridge.spec.ts`, `z-two-factor.spec.ts`
- [x] README + `check:prod` предупреждения для MAX webhook/username
- [x] `0037_user_two_factor` в `drizzle/migrations/meta/_journal.json` (иначе migrate пропускает)

**Бэклог (v61):**
- [x] `max-bridge` middleware: `startapp=booking_*` на `/max/bookings` → query `booking`
- [x] E2E: `data-testid` для phone/email форм логина; карусель на главной в smoke
- [x] `DEPLOY.md` — пошаговая настройка MAX (бот, webhook, мини-app)
- [x] E2E: `FormCitySelect` + `db:seed:cities` в global-setup; хелпер `selectCityInWizard`
- [x] `messaging-bot.service`: импорт `GOLEWOOD_BOT_USER_ID`; хелпер `e2e/helpers/host-listings.ts`
- [x] `/admin/team-badges`: порядок `loadBlogPostsForListing`, try/catch blog posts, UI E2E

**Бэклог (v62):**
- [x] 2FA при OAuth (mock + callback): `completeLogin`, редирект `/auth/login?mfa=1&challenge=…`, шаг MFA на логине (в т.ч. без SMS)
- [x] OAuth: email из профиля при создании/линке; seed host ↔ `mock-yandex`
- [x] E2E: mock Yandex + 2FA на связанном host

**Бэклог (v63 — покупка баллов):**
- [x] `host_promo_purchases`, `points_purchase` (`0039`)
- [x] API покупки баллов, UI `/host/promo#buy`, `/host/promo/pick`

**Бэклог:** —

---

## Фаза 14 — Монетизация: комиссия 10% и сплит выплат (v64)

**Цель:** цена хозяина + **10%** для гостя; при оплате **сплит** хост / платформа (НПД — чек только на комиссию). Отдельно — **покупка баллов** (фаза 10 / v63), **100% платформе**.

### Два потока денег

| Поток | Плательщик | Куда |
|-------|------------|------|
| Бронь | Гость | 10% платформа, остальное хосту |
| Баллы продвижения | Хост | 100% платформе |

### Пример

Хост: 10 000 ₽ → гость: 11 000 ₽ → сплит: 1 000 + 10 000.

### Хост и ЮKassa

Свой магазин ЮKassa **не нужен**. Нужен онбординг выплат: ИНН, р/с, БИК → `yookassa_recipient_id`.

**MVP (частично):**
- [x] Admin dashboard: `admin-dashboard.service` — комиссия с броней, продажа баллов, комиссия с сертификатов
- [x] `PLATFORM_FEE_PERCENT = 10`, `host_amount` / `platform_fee` в `bookings` (`0040`)
- [x] `/host/payout`, `host_payout_profiles`, API `GET|PATCH /api/host/payout`
- [x] Строка сервисного сбора в бронировании
- [x] Сплит в `payment.service` (ЮKassa `transfers` + `platform_fee_amount`)
- [x] Подарочные сертификаты хостов — офферы, покупка (сплит ЮKassa), дашборд, `/host/listings/:id/gift-certificates`, гость `/listings/:id/gift-certificate`
- [x] Блок оплаты без `payout.status === active` (409 `HOST_PAYOUT_NOT_READY`)
- [x] Оферта хозяина (`/host/legal/offer`), отчёт по броням на `/host/bookings` (hostAmount / platformFee)
- [x] Админ: `/admin/host-payouts` — активация `yookassa_recipient_id`

- [x] Погашение подарочного сертификата при бронировании (`giftCertificateCode` в `POST /api/bookings`, поле в `BookingSummary`, preview `POST …/redeem-preview`, E2E `z-gift-certificate-booking.spec.ts`)

- [x] Отчёт хозяину по проданным сертификатам — `/host/gift-certificates`, `GET /api/host/gift-certificates/purchases`

---

## Фаза — Production host (v66) ✅

**Цель:** один VPS, Docker Compose, HTTPS, без dev-дыр.

- [x] `docker-compose.prod.yml` — app на `127.0.0.1:3000`, БД/Redis/Meili без публичных портов, `MEILI_MASTER_KEY`
- [x] `deploy/.env.production.example`, `deploy/Caddyfile.example`, `deploy/cron-hit.sh` + systemd timer
- [x] `scripts/check-prod-env.ts` — HTTPS, Meili key, cron secret, запрет `MARKETPLACE_MOCK` / `AUTH_DEV_CODE`
- [x] `scripts/post-deploy-smoke.sh`, `scripts/docker-entrypoint.sh` (опциональный migrate on start)
- [x] `DEPLOY.md` — чеклист первого выката, Caddy, обновления, MAX, staging YooKassa

**На сервере вручную:** DNS, `.env`, `check:prod`, compose up, migrate, Caddy, webhook YooKassa, S3, reindex.

- [x] `server/utils/dev-guards.ts` — mock/OTP/seed только при `NODE_ENV !== production`

---

## Фаза 15 — Комплекс и домики (v65) ✅

**Цель:** хост объединяет несколько домиков (глэмпинг): общая локация на карточке комплекса, у каждого домика — своя цена, фото, календарь и условия.

**Модель**
- [x] `listings.kind`: `standalone` | `property` | `unit`
- [x] `listings.property_listing_id` — связь домика с комплексом
- [x] Бронь только на `standalone` и `unit`; страница `property` — выбор домика

**Server**
- [x] Миграция `0041`, `listing-property.service`
- [x] `POST /api/host/properties`, `GET /api/host/properties/:id`
- [x] Создание домика с `propertyListingId` в `POST /api/host/listings`
- [x] Поиск/Meili: комплекс с `priceFrom`, домики не дублируются в выдаче

**App**
- [x] `/host/properties/create`, `/host/properties/:id`
- [x] Визард домика: `?propertyId=` наследует город/адрес
- [x] Гость: выбор домика на странице комплекса
- [x] Объединить существующие объявления в комплекс (`POST /api/host/properties/:id/attach`)
- [x] Общие удобства комплекса vs домика (amenities комплекса + домиков в Meili)
- [x] Сводная занятость по комплексу в поиске (комплекс скрывается, если все домики заняты)
- [x] Seed/E2E: демо-комплекс «Глэмпинг «Боровое»», `z-property-complex.spec.ts`
- [x] Даты с комплекса → юнит (`parseBookingRouteQuery`, query на `/listings/:id`)

## Фаза 16 — Каталог glamping.rf parity (v67) ✅

**Цель:** расширить каталог и UX под glamping.rf без копирования дизайна.

- [x] Миграция `0046` — расширение `amenity_catalog`, категории `location` / `activities` / `kitchen` / `kids`
- [x] Миграция `0047` — `accommodation_type_catalog`, фильтр в поиске и форме хоста
- [x] Миграция `0045` — `check_in_time` / `check_out_time` в объявлении и визарде
- [x] Главная: `HomeDiscoveryFilters` → `/search` с пресетами
- [x] Сортировка над результатами (`SearchSort`), не в сайдбаре
- [x] `GET /api/listings/:id/unit-offers`, карточки юнитов с ценой и «Забронировать»
- [x] Reindex-подсказка в `DEPLOY.md` после миграций каталога

**Настройка prod:** после `db:migrate` — **Reindex** (§6 `DEPLOY.md`). MAX — см. фазы 11–12 (только env + business.max.ru).
