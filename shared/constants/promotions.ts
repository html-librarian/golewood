import type { PromotionProduct } from '#shared/types/promotion'

export { HOST_PROMO_BOOKING_REWARD_MAX, HOST_PROMO_BOOKING_REWARD_PERCENT } from '#shared/utils/promotion'

export const PROMOTION_PRODUCTS: PromotionProduct[] = [
  {
    slug: 'highlight',
    titleRu: 'Выделение в выдаче',
    titleEn: 'Highlighted listing',
    descriptionRu: 'Лёгкое цветовое выделение карточки в поиске и в блоке популярных объявлений — 7 дней.',
    descriptionEn: 'Subtle color highlight on cards in search and popular listings — 7 days.',
    pricePoints: 600,
    durationDays: 7,
  },
  {
    slug: 'boost',
    titleRu: 'Поднятие в поиске',
    titleEn: 'Search boost',
    descriptionRu: 'Объявление выше в результатах поиска по городу на 7 дней.',
    descriptionEn: 'Higher placement in city search results for 7 days.',
    pricePoints: 1200,
    durationDays: 7,
  },
  {
    slug: 'city_pin',
    titleRu: 'Закрепление в городе',
    titleEn: 'City pin',
    descriptionRu: 'Первое место в поиске по городу объявления на 7 дней.',
    descriptionEn: 'Top spot in search for the listing city for 7 days.',
    pricePoints: 900,
    durationDays: 7,
  },
]
