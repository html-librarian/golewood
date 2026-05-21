import { describe, expect, it } from 'vitest'
import { buildShareLink } from './share'

const payload = {
  url: 'https://golewood.ru/listings/abc',
  title: 'Уютная студия',
  imageUrl: 'https://golewood.ru/uploads/photo.jpg',
}

describe('buildShareLink', () => {
  it('builds vk share url', () => {
    const link = buildShareLink('vk', payload)
    expect(link).toContain('vk.com/share.php')
    expect(link).toContain(encodeURIComponent(payload.url))
  })

  it('builds pinterest share url with image', () => {
    const link = buildShareLink('pinterest', payload)
    expect(link).toContain('pinterest.com/pin/create/button')
    expect(link).toContain(encodeURIComponent(payload.imageUrl!))
  })

  it('builds telegram share url', () => {
    const link = buildShareLink('telegram', payload)
    expect(link).toContain('t.me/share/url')
  })
})
