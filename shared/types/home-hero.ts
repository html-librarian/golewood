export const HOME_HERO_MODES = ['auto', 'contest', 'custom'] as const
export type HomeHeroMode = typeof HOME_HERO_MODES[number]

export type HomeHeroSource = 'contest' | 'custom' | 'none'

export interface HomeHero {
  imageUrl: string | null
  source: HomeHeroSource
  mode: HomeHeroMode
  creditRu: string | null
  creditEn: string | null
  listingTitle: string | null
  monthKey: string | null
}

export interface HomeHeroAdminSettings {
  mode: HomeHeroMode
  imageUrl: string | null
  creditRu: string | null
  creditEn: string | null
  updatedAt: string
  resolved: HomeHero
}
