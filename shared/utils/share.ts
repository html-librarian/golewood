export type ShareChannel = 'vk' | 'ok' | 'pinterest' | 'telegram'

export interface SharePayload {
  url: string
  title: string
  imageUrl?: string | null
}

export const buildShareLink = (channel: ShareChannel, payload: SharePayload) => {
  const encodedUrl = encodeURIComponent(payload.url)
  const encodedTitle = encodeURIComponent(payload.title)

  if (channel === 'vk') {
    return `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`
  }

  if (channel === 'ok') {
    return `https://connect.ok.ru/offer?url=${encodedUrl}&title=${encodedTitle}`
  }

  if (channel === 'pinterest') {
    const media = payload.imageUrl ? `&media=${encodeURIComponent(payload.imageUrl)}` : ''
    return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}${media}`
  }

  return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
}

export const copyShareUrl = async (url: string) => {
  if (!import.meta.client) {
    throw new Error('Clipboard unavailable')
  }

  const clipboard = (globalThis.navigator as Navigator & {
    clipboard?: { writeText: (text: string) => Promise<void> }
  })?.clipboard

  if (!clipboard?.writeText) {
    throw new Error('Clipboard unavailable')
  }

  await clipboard.writeText(url)
}
