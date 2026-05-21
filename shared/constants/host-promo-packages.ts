import type { HostPromoPointPackage } from '#shared/types/promotion'

/** 1 ₽ = 1 балл; пакеты с небольшой скидкой на крупные покупки. */
export const HOST_PROMO_POINT_PACKAGES: HostPromoPointPackage[] = [
  {
    slug: 'pack_600',
    points: 600,
    priceRub: 600,
    titleRu: '600 баллов',
    titleEn: '600 points',
    descriptionRu: 'Хватит на выделение карточки на 7 дней.',
    descriptionEn: 'Enough for a 7-day highlight.',
  },
  {
    slug: 'pack_1200',
    points: 1200,
    priceRub: 1100,
    titleRu: '1200 баллов',
    titleEn: '1200 points',
    descriptionRu: 'Поднятие в поиске на 7 дней или два тарифа подешевле.',
    descriptionEn: 'Search boost for 7 days or two smaller plans.',
  },
  {
    slug: 'pack_3000',
    points: 3000,
    priceRub: 2500,
    titleRu: '3000 баллов',
    titleEn: '3000 points',
    descriptionRu: 'Несколько продвижений или закрепление в городе.',
    descriptionEn: 'Several promotions or a city pin.',
  },
]

export const getHostPromoPointPackage = (slug: string) =>
  HOST_PROMO_POINT_PACKAGES.find(item => item.slug === slug) ?? null
