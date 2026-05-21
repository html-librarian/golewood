import sharp from 'sharp'
import { LISTING_PHOTO_MAX_BYTES } from '#shared/utils/media-limits'

const MAX_EDGE = 1920
const JPEG_QUALITY = 82

export const processListingPhoto = async (input: Buffer, filename?: string) => {
  if (input.length > LISTING_PHOTO_MAX_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: `Photo exceeds ${Math.round(LISTING_PHOTO_MAX_BYTES / 1024 / 1024)} MB limit`,
    })
  }

  const image = sharp(input, { failOn: 'none' }).rotate()
  const meta = await image.metadata()

  if (!meta.width || !meta.height) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image file' })
  }

  const resized = image.resize({
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: 'inside',
    withoutEnlargement: true,
  })

  const ext = (filename ?? '').toLowerCase()

  if (ext.endsWith('.png')) {
    const data = await resized.png({ compressionLevel: 9 }).toBuffer()
    return { data, filename: 'photo.png', type: 'image/png' }
  }

  const data = await resized.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer()
  return { data, filename: 'photo.jpg', type: 'image/jpeg' }
}

export const processReviewPhoto = async (input: Buffer, filename?: string) =>
  processListingPhoto(input, filename)
