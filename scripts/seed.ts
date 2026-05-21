import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { and, eq, inArray, like, notInArray } from 'drizzle-orm'
import { Meilisearch } from 'meilisearch'
import {
  blogPosts,
  bookings,
  conversations,
  giftCertificateOffers,
  giftCertificatePurchases,
  hostLegalProfiles,
  hostPromoTransactions,
  listingNews,
  listingPhotos,
  listingPromotions,
  listings,
  payments,
  reports,
  reviews,
  teamBadgeCatalog,
  oauthAccounts,
  users,
} from '../server/db/schema/index.ts'
import { calculateBookingPrice, splitBookingSettlement } from '../shared/utils/pricing.ts'
import { isProductionRuntime } from '../shared/utils/runtime-mode.ts'

const PLATFORM_FEE_PERCENT = 10

const splitGiftCertificateSettlement = (totalPrice: number) => {
  const platformFee = Math.round(totalPrice * PLATFORM_FEE_PERCENT / 100)
  return { hostAmount: totalPrice - platformFee, platformFee }
}

const generateGiftCertificateCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''

  for (let i = 0; i < 8; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return `GW-${suffix}`
}

if (isProductionRuntime() && process.env.SEED_ALLOW_PRODUCTION !== '1') {
  console.error(
    'Refusing to run demo seed in production. Use SEED_ALLOW_PRODUCTION=1 only on intentional staging.',
  )
  process.exit(1)
}

const databaseUrl = process.env.NUXT_DATABASE_URL
  ?? 'postgresql://golewood:golewood@localhost:5433/golewood'
const meiliHost = process.env.NUXT_MEILI_HOST ?? 'http://localhost:7700'
const meiliApiKey = process.env.NUXT_MEILI_API_KEY ?? ''

const sql = postgres(databaseUrl)
const db = drizzle(sql)

const DEMO_USERS = [
  { phone: '+79000000001', email: 'admin@golewood.local', name: 'Admin', role: 'admin' as const },
  { phone: '+79000000002', email: 'host@golewood.local', name: 'Host', role: 'host' as const },
  { phone: '+79000000003', email: 'guest@golewood.local', name: 'Guest', role: 'guest' as const },
  {
    id: '00000000-0000-4000-8000-000000000001',
    phone: '+79000000999',
    email: 'bot@golewood.local',
    name: 'Golewood',
    role: 'guest' as const,
  },
]

type DemoListingSeed = {
  hostPhone: string
  title: string
  description: string
  city: string
  address: string
  pricePerNight: number
  cleaningFee: number
  cancellationPolicy: 'flexible' | 'moderate' | 'strict'
  maxGuests: number
  bedrooms: number
  amenities: string[]
  status: 'published' | 'moderation' | 'draft'
  latitude: number
  longitude: number
  photo?: string
  teamBadgeSlug?: 'team_visited' | 'team_approved'
  seedNews?: Array<{ title: string, excerpt: string, body: string }>
}

const SEED_PHOTOS = ['/seed/studio.svg', '/seed/neva.svg', '/seed/loft.svg'] as const

const EXTRA_CITIES = [
  { city: 'Сочи', addressPrefix: 'ул. Курортная', lat: 43.585, lng: 39.72 },
  { city: 'Калининград', addressPrefix: 'ул. Ленинский проспект', lat: 54.71, lng: 20.51 },
  { city: 'Екатеринбург', addressPrefix: 'ул. Малышева', lat: 56.838, lng: 60.597 },
  { city: 'Новосибирск', addressPrefix: 'пр. Красный', lat: 55.03, lng: 82.92 },
  { city: 'Краснодар', addressPrefix: 'ул. Красная', lat: 45.035, lng: 38.975 },
  { city: 'Владивосток', addressPrefix: 'ул. Светланская', lat: 43.115, lng: 131.885 },
  { city: 'Самара', addressPrefix: 'ул. Ленинградская', lat: 53.195, lng: 50.1 },
  { city: 'Нижний Новгород', addressPrefix: 'ул. Большая Покровская', lat: 56.326, lng: 44.006 },
] as const

const EXTRA_TYPES = ['Студия', 'Апартаменты', 'Коттедж', 'Дом', 'Лофт'] as const

const buildExtraDemoListings = (): DemoListingSeed[] => {
  const items: DemoListingSeed[] = []

  for (let i = 0; i < 24; i += 1) {
    const place = EXTRA_CITIES[i % EXTRA_CITIES.length]
    const type = EXTRA_TYPES[i % EXTRA_TYPES.length]
    const price = 3200 + (i % 9) * 450

    items.push({
      hostPhone: '+79000000002',
      title: `${type} «Демо ${i + 1}» — ${place.city}`,
      description: `Демо-объект для проверки поиска и пагинации. ${type} в ${place.city}.`,
      city: place.city,
      address: `${place.addressPrefix}, ${10 + i}`,
      pricePerNight: price,
      cleaningFee: i % 3 === 0 ? 1000 : 0,
      cancellationPolicy: (['flexible', 'moderate', 'strict'] as const)[i % 3],
      maxGuests: 2 + (i % 5),
      bedrooms: 1 + (i % 3),
      amenities: ['wifi', 'kitchen', ...(i % 2 === 0 ? ['washer'] : []), ...(i % 4 === 0 ? ['parking'] : [])],
      status: 'published',
      latitude: place.lat + (i % 7) * 0.002,
      longitude: place.lng + (i % 5) * 0.002,
      photo: SEED_PHOTOS[i % SEED_PHOTOS.length],
      ...(i % 5 === 0 ? { teamBadgeSlug: 'team_visited' as const } : {}),
      ...(i % 7 === 0 ? { teamBadgeSlug: 'team_approved' as const } : {}),
      ...(i % 6 === 0
        ? {
            seedNews: [{
              title: `Новость объекта ${i + 1}`,
              excerpt: 'Короткий анонс обновления от хоста.',
              body: 'Подробности заселения, ремонта и сезонных скидок — всё в этой записи для теста ленты новостей.',
            }],
          }
        : {}),
    })
  }

  return items
}

const DEMO_LISTINGS: DemoListingSeed[] = [
  {
    hostPhone: '+79000000002',
    title: 'Уютная студия у метро',
    description: 'Светлая студия в центре Москвы. Wi-Fi, кухня, постельное бельё.',
    city: 'Москва',
    address: 'ул. Тверская, 10',
    pricePerNight: 4500,
    cleaningFee: 1500,
    cancellationPolicy: 'flexible' as const,
    maxGuests: 2,
    bedrooms: 1,
    amenities: ['wifi', 'kitchen', 'washer'],
    status: 'published' as const,
    latitude: 55.757,
    longitude: 37.615,
    photo: '/seed/studio.svg',
  },
  {
    hostPhone: '+79000000002',
    title: 'Двухкомнатная у Невы',
    description: 'Просторная квартира с видом на воду. Подходит для семьи.',
    city: 'Санкт-Петербург',
    address: 'Наб. реки Фонтанки, 25',
    pricePerNight: 6200,
    cleaningFee: 2000,
    cancellationPolicy: 'moderate' as const,
    maxGuests: 4,
    bedrooms: 2,
    amenities: ['wifi', 'kitchen', 'parking', 'tv'],
    status: 'published' as const,
    latitude: 59.931,
    longitude: 30.341,
    photo: '/seed/neva.svg',
    teamBadgeSlug: 'team_visited',
    seedNews: [{
      title: 'Выходные у Невы: наш отчёт',
      excerpt: 'Команда Golewood провела три дня в этой квартире — делимся впечатлениями.',
      body: 'Мы приехали в пятницу вечером, заселились без сюрпризов. Вид на воду оправдал ожидания, кухня полностью укомплектована. Отдельно отметим тихий двор и удобную парковку рядом.',
    }],
  },
  {
    hostPhone: '+79000000002',
    title: 'Лофт на модерации',
    description: 'Новый объект, ожидает проверки администратором.',
    city: 'Казань',
    address: 'ул. Баумана, 5',
    pricePerNight: 3800,
    cleaningFee: 0,
    cancellationPolicy: 'moderate' as const,
    maxGuests: 3,
    bedrooms: 1,
    amenities: ['wifi', 'kitchen'],
    status: 'moderation' as const,
    latitude: 55.789,
    longitude: 49.122,
    photo: '/seed/loft.svg',
  },
  {
    hostPhone: '+79000000002',
    title: 'Черновик на Арбате',
    description: 'Объект в процессе заполнения.',
    city: 'Москва',
    address: 'ул. Арбат, 1',
    pricePerNight: 5200,
    cleaningFee: 0,
    cancellationPolicy: 'strict' as const,
    maxGuests: 2,
    bedrooms: 1,
    amenities: ['wifi'],
    status: 'draft' as const,
    latitude: 55.752,
    longitude: 37.592,
    photo: '/seed/draft.svg',
  },
  ...buildExtraDemoListings(),
]

type DemoBooking = {
  listingTitle: string
  guestPhone: string
  checkIn: string
  checkOut: string
  guests: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment?: 'pending' | 'waiting_for_capture' | 'succeeded'
  review?: {
    rating: number
    ratings?: {
      cleanliness: number
      checkIn: number
      location: number
      photoMatch: number
      value: number
      service: number
    }
    text: string
    status: 'pending' | 'approved' | 'rejected'
  }
}

const DEMO_PENDING_REVIEW: DemoBooking = {
  listingTitle: 'Двухкомнатная у Невы',
  guestPhone: '+79000000003',
  checkIn: '2027-02-01',
  checkOut: '2027-02-03',
  guests: 2,
  status: 'completed',
  payment: 'succeeded',
    review: {
      rating: 8,
      ratings: {
        cleanliness: 8,
        checkIn: 9,
        location: 8,
        photoMatch: 7,
        value: 8,
        service: 8,
      },
      text: 'Хорошая квартира, но ночью шумно. Жду публикации отзыва.',
      status: 'pending',
    },
}

const DEMO_BOOKINGS: DemoBooking[] = [
  {
    listingTitle: 'Уютная студия у метро',
    guestPhone: '+79000000003',
    checkIn: '2026-08-15',
    checkOut: '2026-08-17',
    guests: 2,
    status: 'pending',
    payment: 'pending',
  },
  {
    listingTitle: 'Двухкомнатная у Невы',
    guestPhone: '+79000000003',
    checkIn: '2026-09-05',
    checkOut: '2026-09-08',
    guests: 3,
    status: 'confirmed',
    payment: 'waiting_for_capture',
  },
  {
    listingTitle: 'Уютная студия у метро',
    guestPhone: '+79000000003',
    checkIn: '2026-04-10',
    checkOut: '2026-04-12',
    guests: 2,
    status: 'completed',
    payment: 'succeeded',
    review: {
      rating: 10,
      ratings: {
        cleanliness: 10,
        checkIn: 10,
        location: 9,
        photoMatch: 10,
        value: 10,
        service: 10,
      },
      text: 'Отличная студия, всё чисто и уютно. Хозяин оперативно ответил на вопросы.',
      status: 'approved',
    },
  },
]

const DEMO_REVIEW_ELIGIBLE: DemoBooking = {
  listingTitle: 'Уютная студия у метро',
  guestPhone: '+79000000003',
  checkIn: '2026-05-01',
  checkOut: '2026-05-03',
  guests: 2,
  status: 'completed',
  payment: 'succeeded',
}

const DEMO_HOST_COMPLETE_BOOKING: DemoBooking = {
  listingTitle: 'Двухкомнатная у Невы',
  guestPhone: '+79000000003',
  checkIn: '2026-04-01',
  checkOut: '2026-04-03',
  guests: 2,
  status: 'confirmed',
  payment: 'succeeded',
}

const upsertUser = async (
  phone: string,
  name: string,
  role: 'guest' | 'host' | 'admin',
  email?: string,
  id?: string,
) => {
  const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1)

  if (existing) {
    const [updated] = await db.update(users)
      .set({
        name,
        role,
        email: email ?? existing.email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning()

    return updated
  }

  const [created] = await db.insert(users).values({
    ...(id ? { id } : {}),
    phone,
    name,
    role,
    email,
  }).returning()

  return created
}

const seedDemoTeamBadgesAndNews = async (
  host: typeof users.$inferSelect,
  listingByTitle: Record<string, typeof listings.$inferSelect>,
  demoListings: DemoListingSeed[],
) => {
  console.log('Seeding team badges and listing news…')

  const badgeRows = await db.select().from(teamBadgeCatalog)
  const badgeBySlug = Object.fromEntries(badgeRows.map(row => [row.slug, row]))
  const listingIds = demoListings
    .map(demo => listingByTitle[demo.title]?.id)
    .filter((id): id is string => Boolean(id))

  if (listingIds.length) {
    await db.delete(listingNews).where(inArray(listingNews.listingId, listingIds))
  }

  for (const demo of demoListings) {
    const listing = listingByTitle[demo.title]

    if (!listing) {
      continue
    }

    if (demo.teamBadgeSlug) {
      const badge = badgeBySlug[demo.teamBadgeSlug]

      if (badge) {
        let blogPostId: string | null = null

        if (badge.requiresBlogPost) {
          const slug = `seed-${demo.teamBadgeSlug}-${listing.id.slice(0, 8)}`
          const [existingBlog] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1)

          if (existingBlog) {
            blogPostId = existingBlog.id
          } else {
            const [blog] = await db.insert(blogPosts).values({
              slug,
              titleRu: `Обзор: ${demo.title}`,
              titleEn: `Review: ${demo.title}`,
              excerptRu: demo.seedNews?.[0]?.excerpt ?? 'Демо-обзор команды Golewood.',
              excerptEn: 'Demo team review.',
              bodyRu: demo.seedNews?.[0]?.body ?? 'Полный текст обзора для теста.',
              bodyEn: 'Full review text for testing.',
              listingId: listing.id,
              status: 'published',
              publishedAt: new Date(),
            }).returning()

            blogPostId = blog.id
          }
        }

        await db.update(listings)
          .set({
            teamBadgeId: badge.id,
            teamBadgeBlogPostId: blogPostId,
            updatedAt: new Date(),
          })
          .where(eq(listings.id, listing.id))

        console.log(`  badge ${demo.teamBadgeSlug}: ${demo.title}`)
      }
    } else {
      await db.update(listings)
        .set({ teamBadgeId: null, teamBadgeBlogPostId: null, updatedAt: new Date() })
        .where(eq(listings.id, listing.id))
    }

    if (demo.seedNews?.length) {
      for (const news of demo.seedNews) {
        await db.insert(listingNews).values({
          listingId: listing.id,
          hostId: host.id,
          title: news.title,
          excerpt: news.excerpt,
          body: news.body,
          status: 'published',
          publishedAt: new Date(),
        })
      }

      console.log(`  news: ${demo.title} (${demo.seedNews.length})`)
    }
  }
}

const upsertListing = async (
  hostId: string,
  demo: DemoListingSeed,
) => {
  const [existing] = await db.select().from(listings).where(
    and(eq(listings.hostId, hostId), eq(listings.address, demo.address)),
  ).limit(1)

  const existingByTitle = existing ?? (await db.select().from(listings).where(eq(listings.title, demo.title)).limit(1))[0]

  if (existingByTitle) {
    const [updated] = await db.update(listings)
      .set({
        hostId,
        title: demo.title,
        description: demo.description,
        city: demo.city,
        address: demo.address,
        pricePerNight: demo.pricePerNight,
        cleaningFee: demo.cleaningFee,
        cancellationPolicy: demo.cancellationPolicy,
        maxGuests: demo.maxGuests,
        bedrooms: demo.bedrooms,
        amenities: demo.amenities,
        status: demo.status,
        latitude: demo.latitude,
        longitude: demo.longitude,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, existingByTitle.id))
      .returning()

    return { row: updated, created: false }
  }

  const [created] = await db.insert(listings).values({
    hostId,
    title: demo.title,
    description: demo.description,
    city: demo.city,
    address: demo.address,
    pricePerNight: demo.pricePerNight,
    cleaningFee: demo.cleaningFee,
    cancellationPolicy: demo.cancellationPolicy,
    maxGuests: demo.maxGuests,
    bedrooms: demo.bedrooms,
    amenities: demo.amenities,
    status: demo.status,
    latitude: demo.latitude,
    longitude: demo.longitude,
  }).returning()

  return { row: created, created: true }
}

const resetDemoTransactionalData = async (guestId: string) => {
  await db.delete(reports).where(eq(reports.reporterId, guestId))
  await db.delete(conversations).where(eq(conversations.guestId, guestId))
  await db.delete(bookings).where(eq(bookings.guestId, guestId))
}

const toDate = (value: string) => new Date(`${value}T00:00:00Z`)

const countNights = (checkIn: string, checkOut: string) => {
  const start = toDate(checkIn)
  const end = toDate(checkOut)
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
}

const seedSingleBooking = async (
  demo: DemoBooking,
  userByPhone: Record<string, typeof users.$inferSelect>,
  listingByTitle: Record<string, typeof listings.$inferSelect>,
) => {
  const guest = userByPhone[demo.guestPhone]
  const listing = listingByTitle[demo.listingTitle]
  const nights = countNights(demo.checkIn, demo.checkOut)
  const pricing = calculateBookingPrice(nights, listing.pricePerNight)
  const totalPrice = pricing.total
  const { hostAmount, platformFee } = splitBookingSettlement(pricing)

  const [booking] = await db.insert(bookings).values({
    listingId: listing.id,
    guestId: guest.id,
    checkIn: toDate(demo.checkIn),
    checkOut: toDate(demo.checkOut),
    guests: demo.guests,
    totalPrice,
    hostAmount,
    platformFee,
    status: demo.status,
  }).returning()

  if (demo.payment) {
    await db.insert(payments).values({
      bookingId: booking.id,
      yookassaPaymentId: `mock-seed-${booking.id.slice(0, 8)}`,
      amount: totalPrice,
      status: demo.payment,
      confirmationUrl: demo.payment === 'pending'
        ? `http://localhost:3000/bookings/${booking.id}/pay?return=1`
        : null,
    })
  }

  if (demo.review) {
    const ratings = demo.review.ratings ?? {
      cleanliness: demo.review.rating,
      checkIn: demo.review.rating,
      location: demo.review.rating,
      photoMatch: demo.review.rating,
      value: demo.review.rating,
      service: demo.review.rating,
    }

    await db.insert(reviews).values({
      bookingId: booking.id,
      listingId: listing.id,
      authorId: guest.id,
      rating: demo.review.rating,
      ratingCleanliness: ratings.cleanliness,
      ratingCheckIn: ratings.checkIn,
      ratingLocation: ratings.location,
      ratingPhotoMatch: ratings.photoMatch,
      ratingValue: ratings.value,
      ratingService: ratings.service,
      text: demo.review.text,
      status: demo.review.status,
    })
  }

  return booking
}

const seedBookings = async (
  userByPhone: Record<string, typeof users.$inferSelect>,
  listingByTitle: Record<string, typeof listings.$inferSelect>,
) => {
  console.log('Seeding demo bookings…')

  for (const demo of DEMO_BOOKINGS) {
    await seedSingleBooking(demo, userByPhone, listingByTitle)
    console.log(`  ${demo.status}: ${demo.listingTitle} (${demo.checkIn} → ${demo.checkOut})`)
    if (demo.review) {
      console.log(`    review: ${demo.review.status}, ★${demo.review.rating}`)
    }
  }
}

const seedE2eBookings = async (
  userByPhone: Record<string, typeof users.$inferSelect>,
  listingByTitle: Record<string, typeof listings.$inferSelect>,
) => {
  console.log('E2E mode: seeding guest bookings')

  const demos = [DEMO_BOOKINGS[0], DEMO_BOOKINGS[1], DEMO_BOOKINGS[2], DEMO_REVIEW_ELIGIBLE, DEMO_HOST_COMPLETE_BOOKING]

  for (const demo of demos) {
    await seedSingleBooking(demo, userByPhone, listingByTitle)
    console.log(`  ${demo.status}: ${demo.listingTitle} (${demo.checkIn} → ${demo.checkOut})`)
  }
}

const seedPendingReview = async (
  userByPhone: Record<string, typeof users.$inferSelect>,
  listingByTitle: Record<string, typeof listings.$inferSelect>,
) => {
  console.log('Seeding pending review…')
  await seedSingleBooking(DEMO_PENDING_REVIEW, userByPhone, listingByTitle)
  console.log(`  pending review on ${DEMO_PENDING_REVIEW.listingTitle}`)
}

const seedReports = async (
  guest: typeof users.$inferSelect,
  moderationListing: typeof listings.$inferSelect,
) => {
  console.log('Seeding demo reports…')

  await db.insert(reports).values({
    reporterId: guest.id,
    type: 'listing',
    listingId: moderationListing.id,
    reason: 'Подозрительные фото в объявлении, прошу проверить.',
    status: 'open',
  })

  console.log('  open report on moderation listing')
}

const resetNonDemoData = async () => {
  const demoPhones = DEMO_USERS.map(user => user.phone)
  const demoTitles = DEMO_LISTINGS.map(listing => listing.title)

  console.log('Resetting non-demo data…')

  await db.delete(listings).where(notInArray(listings.title, demoTitles))
  await db.delete(users).where(notInArray(users.phone, demoPhones))

  console.log('  removed users/listings outside demo set')
}

const resetDemoPromotions = async (hostId: string) => {
  const demoTitles = DEMO_LISTINGS.map(listing => listing.title)
  const rows = await db.select({ id: listings.id }).from(listings).where(inArray(listings.title, demoTitles))
  const listingIds = rows.map(row => row.id)

  if (listingIds.length) {
    await db.delete(giftCertificatePurchases).where(inArray(giftCertificatePurchases.listingId, listingIds))
    await db.delete(giftCertificateOffers).where(inArray(giftCertificateOffers.listingId, listingIds))
    await db.delete(listingPromotions).where(inArray(listingPromotions.listingId, listingIds))
  }

  await db.delete(hostPromoTransactions).where(eq(hostPromoTransactions.userId, hostId))
}

const seedGiftCertificates = async (
  host: typeof users.$inferSelect,
  guest: typeof users.$inferSelect,
  listingByTitle: Record<string, typeof listings.$inferSelect>,
) => {
  const listing = listingByTitle['Уютная студия у метро']

  if (!listing) {
    return
  }

  const existingPurchases = await db.select({ id: giftCertificatePurchases.id })
    .from(giftCertificatePurchases)
    .where(eq(giftCertificatePurchases.listingId, listing.id))

  if (existingPurchases.length) {
    const purchaseIds = existingPurchases.map(row => row.id)

    await db.update(bookings)
      .set({ giftCertificatePurchaseId: null, giftCertificateCredit: 0 })
      .where(inArray(bookings.giftCertificatePurchaseId, purchaseIds))
    await db.delete(giftCertificatePurchases).where(eq(giftCertificatePurchases.listingId, listing.id))
  }

  console.log('Seeding demo gift certificates…')

  const amounts = [5_000, 10_000] as const
  const offers = []

  for (const amountRub of amounts) {
    const [offer] = await db.insert(giftCertificateOffers).values({
      listingId: listing.id,
      hostId: host.id,
      amountRub,
      isActive: true,
    }).onConflictDoUpdate({
      target: [giftCertificateOffers.listingId, giftCertificateOffers.amountRub],
      set: { isActive: true, updatedAt: new Date() },
    }).returning()

    offers.push(offer)
  }

  const now = new Date()
  const purchaseSpecs = [
    { offerIndex: 0, daysAgo: 12 },
    { offerIndex: 1, daysAgo: 8 },
    { offerIndex: 0, daysAgo: 3 },
  ]

  for (const [index, spec] of purchaseSpecs.entries()) {
    const offer = offers[spec.offerIndex]
    const createdAt = new Date(now)
    createdAt.setDate(createdAt.getDate() - spec.daysAgo)
    const expiresAt = new Date(createdAt)
    expiresAt.setDate(expiresAt.getDate() + 365)
    const { hostAmount, platformFee } = splitGiftCertificateSettlement(offer.amountRub)

    await db.insert(giftCertificatePurchases).values({
      offerId: offer.id,
      listingId: listing.id,
      hostId: host.id,
      buyerId: guest.id,
      totalPrice: offer.amountRub,
      hostAmount,
      platformFee,
      code: process.env.SEED_E2E === '1' && index === 0
        ? 'GW-E2E5000'
        : generateGiftCertificateCode(),
      status: 'paid',
      yookassaPaymentId: `mock-seed-gift-${index}-${offer.id.slice(0, 8)}`,
      expiresAt,
      createdAt,
      updatedAt: createdAt,
    })
  }

  console.log('  gift certificates: 2 offers, 3 paid purchases')
}

const resetE2eCreatedListings = async () => {
  const demoAddresses = DEMO_LISTINGS.map(listing => listing.address)
  const rows = await db.select().from(listings).where(like(listings.title, 'E2E %'))

  if (!rows.length) {
    return
  }

  const removable = rows.filter(row => !demoAddresses.includes(row.address))

  if (!removable.length) {
    console.log('E2E cleanup: demo listings with E2E titles will be restored by upsert')
    return
  }

  const ids = removable.map(row => row.id)
  console.log(`E2E cleanup: removing ${ids.length} test listing(s)…`)

  const bookingRows = await db.select({ id: bookings.id }).from(bookings).where(inArray(bookings.listingId, ids))
  const bookingIds = bookingRows.map(row => row.id)

  if (bookingIds.length) {
    await db.delete(payments).where(inArray(payments.bookingId, bookingIds))
    await db.delete(reviews).where(inArray(reviews.bookingId, bookingIds))
    await db.delete(bookings).where(inArray(bookings.id, bookingIds))
  }

  await db.delete(reports).where(inArray(reports.listingId, ids))
  await db.delete(listingPhotos).where(inArray(listingPhotos.listingId, ids))
  await db.delete(listings).where(inArray(listings.id, ids))
}

const attachListingPhoto = async (listingId: string, title: string, url: string) => {
  await db.delete(listingPhotos).where(eq(listingPhotos.listingId, listingId))
  await db.insert(listingPhotos).values({
    listingId,
    url,
    sortOrder: 0,
  })
  console.log(`  ${title} → ${url}`)
}

const seedPropertyComplex = async (
  hostId: string,
  listingByTitle: Record<string, typeof listings.$inferSelect>,
) => {
  const propertyAddress = 'Московская обл., пос. Покровское, 1'
  const propertyTitle = 'Глэмпинг «Боровое»'
  const [existingProperty] = await db.select().from(listings).where(
    and(eq(listings.hostId, hostId), eq(listings.address, propertyAddress)),
  ).limit(1)

  const propertyPayload = {
    hostId,
    kind: 'property' as const,
    title: propertyTitle,
    description: 'Комплекс домиков у леса: выберите вариант размещения, даты и забронируйте нужный юнит.',
    city: 'Москва',
    address: propertyAddress,
    pricePerNight: 4000,
    cleaningFee: 0,
    cancellationPolicy: 'moderate' as const,
    maxGuests: 4,
    bedrooms: 0,
    amenities: ['wifi', 'parking', 'location_forest', 'bbq'],
    status: 'published' as const,
    latitude: 55.82,
    longitude: 37.12,
    checkInTime: '15:00',
    checkOutTime: '12:00',
  }

  const property = existingProperty
    ? (await db.update(listings)
        .set({ ...propertyPayload, updatedAt: new Date() })
        .where(eq(listings.id, existingProperty.id))
        .returning())[0]
    : (await db.insert(listings).values(propertyPayload).returning())[0]

  listingByTitle[propertyTitle] = property

  const unitSpecs = [
    {
      title: 'Домик «Сосна»',
      suffix: 'д. 1',
      pricePerNight: 4000,
      maxGuests: 2,
      bedrooms: 1,
      accommodationType: 'eco_house',
      amenities: ['wifi', 'kitchen', 'heating'],
      photo: '/seed/studio.svg',
    },
    {
      title: 'Купол «Звезда»',
      suffix: 'д. 2',
      pricePerNight: 6500,
      maxGuests: 3,
      bedrooms: 1,
      accommodationType: 'dome_house',
      amenities: ['wifi', 'kitchen', 'heating', 'hot_tub'],
      photo: '/seed/neva.svg',
    },
  ] as const

  for (const spec of unitSpecs) {
    const unitAddress = `${propertyAddress}, ${spec.suffix}`
    const [existingUnit] = await db.select().from(listings).where(
      and(eq(listings.hostId, hostId), eq(listings.address, unitAddress)),
    ).limit(1)

    const unitPayload = {
      hostId,
      kind: 'unit' as const,
      propertyListingId: property.id,
      title: spec.title,
      description: `Юнит «${spec.title}» в составе ${propertyTitle}.`,
      city: 'Москва',
      address: unitAddress,
      pricePerNight: spec.pricePerNight,
      cleaningFee: 0,
      cancellationPolicy: 'moderate' as const,
      maxGuests: spec.maxGuests,
      bedrooms: spec.bedrooms,
      amenities: [...spec.amenities],
      accommodationType: spec.accommodationType,
      status: 'published' as const,
      latitude: property.latitude,
      longitude: property.longitude,
      checkInTime: '15:00',
      checkOutTime: '12:00',
    }

    const unit = existingUnit
      ? (await db.update(listings)
          .set({ ...unitPayload, updatedAt: new Date() })
          .where(eq(listings.id, existingUnit.id))
          .returning())[0]
      : (await db.insert(listings).values(unitPayload).returning())[0]

    listingByTitle[spec.title] = unit
    await attachListingPhoto(unit.id, spec.title, spec.photo)
  }

  await attachListingPhoto(property.id, propertyTitle, '/seed/loft.svg')
  console.log(`  property complex: ${propertyTitle} (${unitSpecs.length} units)`)
}

const seedListingPhotos = async (
  listingByTitle: Record<string, typeof listings.$inferSelect>,
) => {
  console.log('Seeding demo photos…')

  for (const demo of DEMO_LISTINGS) {
    if (!demo.photo) {
      continue
    }

    const listing = listingByTitle[demo.title]
    await attachListingPhoto(listing.id, demo.title, demo.photo)
  }
}

const reindexPublished = async () => {
  const client = new Meilisearch({ host: meiliHost, apiKey: meiliApiKey || undefined })
  const index = client.index('listings')

  try {
    await index.getRawInfo()
  } catch {
    await client.createIndex('listings', { primaryKey: 'id' })
    await index.updateFilterableAttributes([
      'status',
      'city',
      'pricePerNight',
      'maxGuests',
      'amenities',
      'accommodationTypes',
      'kind',
    ])
    await index.updateSortableAttributes(['pricePerNight'])
  }

  const rows = await db.select().from(listings).where(eq(listings.status, 'published'))
  const documents = []

  for (const row of rows) {
    if (row.kind === 'unit') {
      continue
    }

    const [photo] = await db.select().from(listingPhotos)
      .where(eq(listingPhotos.listingId, row.id))
      .orderBy(listingPhotos.sortOrder)
      .limit(1)

    let pricePerNight = row.pricePerNight
    const accommodationTypes = new Set<string>()
    const amenities = new Set<string>(row.amenities ?? [])

    if (row.accommodationType) {
      accommodationTypes.add(row.accommodationType)
    }

    if (row.kind === 'property') {
      const unitRows = await db.select({
        pricePerNight: listings.pricePerNight,
        accommodationType: listings.accommodationType,
        amenities: listings.amenities,
      }).from(listings).where(and(
        eq(listings.propertyListingId, row.id),
        eq(listings.kind, 'unit'),
        eq(listings.status, 'published'),
      ))

      for (const unit of unitRows) {
        pricePerNight = Math.min(pricePerNight, unit.pricePerNight)

        if (unit.accommodationType) {
          accommodationTypes.add(unit.accommodationType)
        }

        for (const slug of unit.amenities ?? []) {
          amenities.add(slug)
        }
      }
    }

    documents.push({
      id: row.id,
      title: row.title,
      description: row.description,
      city: row.city,
      address: row.address,
      pricePerNight,
      maxGuests: row.maxGuests,
      bedrooms: row.bedrooms,
      amenities: [...amenities],
      accommodationTypes: [...accommodationTypes],
      kind: row.kind,
      latitude: row.latitude,
      longitude: row.longitude,
      coverPhotoUrl: photo?.url ?? null,
      managedByTeam: row.managedByTeam,
      boostScore: 0,
      highlightScore: 0,
      cityPinScore: 0,
      _geo: row.latitude && row.longitude ? { lat: row.latitude, lng: row.longitude } : null,
    })
  }

  await index.deleteAllDocuments()

  if (documents.length) {
    await index.addDocuments(documents.map(doc => ({ ...doc, status: 'published' })))
  }

  return documents.length
}

const e2eMode = process.env.SEED_E2E === '1'
const resetMode = process.env.SEED_RESET === '1'

const seed = async () => {
  if (resetMode) {
    await resetNonDemoData()
  }

  if (e2eMode) {
    await resetE2eCreatedListings()
  }

  console.log('Seeding demo users…')

  const userByPhone: Record<string, typeof users.$inferSelect> = {}

  for (const demo of DEMO_USERS) {
    userByPhone[demo.phone] = await upsertUser(
      demo.phone,
      demo.name,
      demo.role,
      demo.email,
      'id' in demo ? demo.id : undefined,
    )
    console.log(`  ${demo.role}: ${demo.phone}`)
  }

  const guest = userByPhone['+79000000003']
  const host = userByPhone['+79000000002']
  await resetDemoPromotions(host.id)
  await db.update(users).set({ bonusBalance: 3_500 }).where(eq(users.id, guest.id))
  await db.update(users).set({ hostPromoBalance: 5_000 }).where(eq(users.id, host.id))

  const maxLinkedAt = new Date()
  await db.update(users)
    .set({ maxUserId: 9_000_000_002, maxLinkedAt, twoFactorEnabled: false, updatedAt: maxLinkedAt })
    .where(eq(users.id, host.id))
  await db.update(users)
    .set({ maxUserId: 9_000_000_003, maxLinkedAt, twoFactorEnabled: false, updatedAt: maxLinkedAt })
    .where(eq(users.id, guest.id))

  await db.insert(hostLegalProfiles).values({
    userId: host.id,
    isVerified: true,
    legalType: 'company',
    legalName: 'ООО «Демо Хост»',
    inn: '7701234567',
    ogrn: '1234567890123',
    legalAddress: 'г. Москва, ул. Тверская, д. 10',
    workingHoursNote: 'в соответствии с временем заезда и выезда объекта',
    verifiedAt: new Date(),
  }).onConflictDoUpdate({
    target: hostLegalProfiles.userId,
    set: {
      isVerified: true,
      legalType: 'company',
      legalName: 'ООО «Демо Хост»',
      inn: '7701234567',
      ogrn: '1234567890123',
      legalAddress: 'г. Москва, ул. Тверская, д. 10',
      workingHoursNote: 'в соответствии с временем заезда и выезда объекта',
      verifiedAt: new Date(),
      updatedAt: new Date(),
    },
  })

  console.log('  verified host: +79000000002')

  await db.insert(oauthAccounts).values({
    userId: host.id,
    provider: 'yandex',
    providerUserId: 'mock-yandex',
    profileName: 'Yandex User (dev)',
  }).onConflictDoUpdate({
    target: [oauthAccounts.provider, oauthAccounts.providerUserId],
    set: {
      userId: host.id,
      profileName: 'Yandex User (dev)',
    },
  })
  console.log('  oauth: host ↔ mock-yandex')

  await resetDemoTransactionalData(guest.id)

  console.log('Seeding demo listings…')

  const listingByTitle: Record<string, typeof listings.$inferSelect> = {}

  for (const demo of DEMO_LISTINGS) {
    const host = userByPhone[demo.hostPhone]
    const { row, created } = await upsertListing(host.id, demo)
    listingByTitle[demo.title] = row
    console.log(`  ${created ? 'created' : 'updated'}: ${demo.title} [${demo.status}]`)
  }

  await seedPropertyComplex(host.id, listingByTitle)
  await seedListingPhotos(listingByTitle)
  await seedDemoTeamBadgesAndNews(host, listingByTitle, DEMO_LISTINGS)

  const teamCatalogTitle = 'Двухкомнатная у Невы'
  const teamCatalogListing = listingByTitle[teamCatalogTitle]

  if (teamCatalogListing) {
    await db.update(listings)
      .set({ managedByTeam: true, updatedAt: new Date() })
      .where(eq(listings.id, teamCatalogListing.id))

    console.log(`  team-managed catalog: ${teamCatalogTitle}`)
  }

  if (e2eMode) {
    await seedE2eBookings(userByPhone, listingByTitle)
    await seedGiftCertificates(host, guest, listingByTitle)
  } else {
    await seedBookings(userByPhone, listingByTitle)
    await seedGiftCertificates(host, guest, listingByTitle)
    await seedSingleBooking(DEMO_REVIEW_ELIGIBLE, userByPhone, listingByTitle)
    await seedSingleBooking(DEMO_HOST_COMPLETE_BOOKING, userByPhone, listingByTitle)
    console.log(`  review-eligible: ${DEMO_REVIEW_ELIGIBLE.listingTitle} (${DEMO_REVIEW_ELIGIBLE.checkIn} → ${DEMO_REVIEW_ELIGIBLE.checkOut})`)
    console.log(`  host-complete: ${DEMO_HOST_COMPLETE_BOOKING.listingTitle} (${DEMO_HOST_COMPLETE_BOOKING.checkIn} → ${DEMO_HOST_COMPLETE_BOOKING.checkOut})`)
  }
  await seedPendingReview(userByPhone, listingByTitle)
  await seedReports(guest, listingByTitle['Лофт на модерации'])

  const indexed = await reindexPublished()
  console.log(`Meilisearch: indexed ${indexed} published listings`)

  await sql`
    UPDATE listings
    SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    WHERE location IS NULL AND (latitude <> 0 OR longitude <> 0)
  `
  console.log('PostGIS: synced listing locations')

  const demoListings = await db.select({ title: listings.title })
    .from(listings)
    .where(inArray(listings.title, DEMO_LISTINGS.map(item => item.title)))

  console.log('\nSummary:')
  console.log(`  demo listings: ${demoListings.length}`)
  if (e2eMode) {
    console.log('  demo bookings: 5 (E2E: pending + confirmed/refund + completed/review + review-eligible + host-complete)')
  } else {
    console.log(`  demo bookings: ${DEMO_BOOKINGS.length + 2}`)
    console.log('  1 approved review + 1 review-eligible stay')
  }
  console.log('  1 pending review')
  console.log('  1 open report')
  console.log('\nDemo accounts (email OTP code: 0000 with NUXT_AUTH_DEV_CODE):')
  console.log('  Admin  admin@golewood.local')
  console.log('  Host   host@golewood.local')
  console.log('  Guest  guest@golewood.local')
}

seed()
  .then(() => {
    console.log('\nDone.')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await sql.end()
  })
