import type { HomePromoBanner } from '#shared/types/home-promo'

export interface HomePromoBannerProps {
  banner: HomePromoBanner
  variant: 'featured' | 'carousel'
}
