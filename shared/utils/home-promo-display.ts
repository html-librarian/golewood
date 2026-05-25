import type { HomePromoBanner } from '#shared/types/home-promo'

export const homePromoHasPhoto = (
  banner: Pick<HomePromoBanner, 'imageDesktopUrl' | 'imageTabletUrl' | 'imageMobileUrl'>,
) => Boolean(banner.imageDesktopUrl || banner.imageTabletUrl || banner.imageMobileUrl)

/** Photo URLs take precedence over gradient (same idea as the home hero). */
export const homePromoUsesImageBackground = (
  banner: Pick<HomePromoBanner, 'imageDesktopUrl' | 'imageTabletUrl' | 'imageMobileUrl'>,
) => homePromoHasPhoto(banner)
