import { describe, expect, it } from 'vitest'
import { homePromoHasPhoto, homePromoUsesImageBackground } from './home-promo-display'

describe('homePromoHasPhoto', () => {
  it('is false when all image fields are empty', () => {
    expect(homePromoHasPhoto({
      imageDesktopUrl: null,
      imageTabletUrl: null,
      imageMobileUrl: null,
    })).toBe(false)
  })

  it('is true when any breakpoint has a URL', () => {
    expect(homePromoHasPhoto({
      imageDesktopUrl: null,
      imageTabletUrl: '/uploads/x.jpg',
      imageMobileUrl: null,
    })).toBe(true)
  })
})

describe('homePromoUsesImageBackground', () => {
  it('shows image background whenever a photo exists', () => {
    expect(homePromoUsesImageBackground({
      imageDesktopUrl: '/uploads/a.jpg',
      imageTabletUrl: null,
      imageMobileUrl: null,
    })).toBe(true)
  })
})
