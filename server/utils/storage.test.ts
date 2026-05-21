import { describe, expect, it } from 'vitest'
import { isAllowedPhotoExtension, resolvePhotoExtension } from './storage'

describe('storage photo extensions', () => {
  it('resolves extension from filename', () => {
    expect(resolvePhotoExtension('photo.jpg')).toBe('.jpg')
    expect(resolvePhotoExtension('photo.JPEG')).toBe('.jpeg')
    expect(resolvePhotoExtension(undefined)).toBe('.jpg')
  })

  it('allows jpg, jpeg, png and webp', () => {
    expect(isAllowedPhotoExtension('a.jpg')).toBe(true)
    expect(isAllowedPhotoExtension('a.jpeg')).toBe(true)
    expect(isAllowedPhotoExtension('a.png')).toBe(true)
    expect(isAllowedPhotoExtension('a.webp')).toBe(true)
  })

  it('rejects unsupported types', () => {
    expect(isAllowedPhotoExtension('a.svg')).toBe(false)
    expect(isAllowedPhotoExtension('a.gif')).toBe(false)
    expect(isAllowedPhotoExtension('a.pdf')).toBe(false)
  })
})
