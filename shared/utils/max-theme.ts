import type { MaxThemeParams } from '#shared/types/max-theme'

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '').trim()

  if (normalized.length === 3) {
    const [r, g, b] = normalized.split('')
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
    }
  }

  if (normalized.length !== 6) {
    return null
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

export const isDarkHexColor = (hex: string) => {
  const rgb = hexToRgb(hex)

  if (!rgb) {
    return false
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance < 0.5
}

export const resolveMaxColorScheme = (input: {
  colorScheme?: string | null
  themeParams?: MaxThemeParams | null
}): 'light' | 'dark' | null => {
  if (input.colorScheme === 'dark' || input.colorScheme === 'light') {
    return input.colorScheme
  }

  const bg = input.themeParams?.bg_color ?? input.themeParams?.secondary_bg_color

  if (bg) {
    return isDarkHexColor(bg) ? 'dark' : 'light'
  }

  return null
}

export const maxThemeParamKeys: (keyof MaxThemeParams)[] = [
  'bg_color',
  'secondary_bg_color',
  'text_color',
  'hint_color',
  'link_color',
  'button_color',
  'button_text_color',
  'header_bg_color',
]
