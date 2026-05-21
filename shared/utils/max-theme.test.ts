import { describe, expect, it } from 'vitest'
import { isDarkHexColor, resolveMaxColorScheme } from './max-theme'

describe('max-theme utils', () => {
  it('detects dark background from hex', () => {
    expect(isDarkHexColor('#1a1a1a')).toBe(true)
    expect(isDarkHexColor('#ffffff')).toBe(false)
  })

  it('resolves scheme from theme params', () => {
    expect(resolveMaxColorScheme({
      themeParams: { bg_color: '#ffffff' },
    })).toBe('light')

    expect(resolveMaxColorScheme({
      colorScheme: 'dark',
      themeParams: { bg_color: '#ffffff' },
    })).toBe('dark')
  })
})
