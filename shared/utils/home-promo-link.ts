import type { HomePromoBanner } from '#shared/types/home-promo'

export const isExternalPromoHref = (href: string) => /^https?:\/\//i.test(href)

export const resolveHomePromoHref = (
  banner: Pick<HomePromoBanner, 'linkHref' | 'linkExternal'>,
  localePath: (path: string) => string,
) => {
  if (banner.linkExternal || isExternalPromoHref(banner.linkHref)) {
    return banner.linkHref
  }

  return localePath(banner.linkHref)
}
