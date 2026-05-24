import type { HomeHero, HomeHeroMode } from '#shared/types/home-hero'
import type { SpotlightHero } from '#shared/types/spotlight'

export type HomeHeroSettingsRow = {
  mode: HomeHeroMode
  imageUrl: string | null
  creditRu: string | null
  creditEn: string | null
}

export const resolveHomeHero = (
  settings: HomeHeroSettingsRow,
  contest: SpotlightHero,
): HomeHero => {
  const customBase: HomeHero = {
    imageUrl: settings.imageUrl,
    source: settings.imageUrl ? 'custom' : 'none',
    mode: settings.mode,
    creditRu: settings.creditRu,
    creditEn: settings.creditEn,
    listingTitle: null,
    monthKey: null,
  }

  const contestBase: HomeHero = {
    imageUrl: contest.imageUrl,
    source: contest.imageUrl ? 'contest' : 'none',
    mode: settings.mode,
    creditRu: null,
    creditEn: null,
    listingTitle: contest.listingTitle,
    monthKey: contest.monthKey,
  }

  if (settings.mode === 'custom') {
    return customBase
  }

  if (settings.mode === 'contest') {
    return contestBase
  }

  if (contest.imageUrl) {
    return contestBase
  }

  return customBase
}
