export type HomePromoSlot = 'featured' | 'carousel'

export type HomePromoBackgroundMode = 'image' | 'gradient'

export type HomePromoImageBreakpoint = 'desktop' | 'tablet' | 'mobile'

export interface HomePromoBanner {
  id: string
  slot: HomePromoSlot
  titleRu: string | null
  titleEn: string | null
  subtitleRu: string | null
  subtitleEn: string | null
  ctaRu: string | null
  ctaEn: string | null
  linkHref: string
  linkExternal: boolean
  backgroundMode: HomePromoBackgroundMode
  tone: string
  imageDesktopUrl: string | null
  imageTabletUrl: string | null
  imageMobileUrl: string | null
  active: boolean
  sortOrder: number
}

export interface HomePromoSection {
  featured: HomePromoBanner | null
  carousel: HomePromoBanner[]
}
