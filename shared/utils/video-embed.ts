export type VideoProvider = 'youtube' | 'rutube' | 'vk' | 'unknown'

export interface ParsedVideoEmbed {
  provider: VideoProvider
  embedUrl: string
  thumbnailUrl: string
}

const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i
const RUTUBE_RE = /rutube\.ru\/(?:video|play\/embed)\/([a-f0-9]+)/i
const VK_RE = /vk\.com\/(?:video|clip)(-?\d+)_(\d+)/i

export const parseVideoEmbedUrl = (raw: string): ParsedVideoEmbed | null => {
  const url = raw.trim()

  if (!url) {
    return null
  }

  const youtube = url.match(YOUTUBE_RE)

  if (youtube?.[1]) {
    const id = youtube[1]
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${id}`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    }
  }

  const rutube = url.match(RUTUBE_RE)

  if (rutube?.[1]) {
    const id = rutube[1]
    return {
      provider: 'rutube',
      embedUrl: `https://rutube.ru/play/embed/${id}`,
      thumbnailUrl: `https://pic.rutube.ru/${id.slice(0, 2)}/${id.slice(2, 4)}/${id.slice(4, 6)}/${id}/preview.jpg`,
    }
  }

  const vk = url.match(VK_RE)

  if (vk?.[1] && vk[2]) {
    const oid = vk[1]
    const vid = vk[2]
    return {
      provider: 'vk',
      embedUrl: `https://vk.com/video_ext.php?oid=${oid}&id=${vid}`,
      thumbnailUrl: '',
    }
  }

  return null
}
