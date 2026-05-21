import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const ALLOWED_PHOTO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const ALLOWED_STORY_VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v'])
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'])

export const resolvePhotoExtension = (filename?: string) => {
  const ext = extname(filename ?? '.jpg').toLowerCase() || '.jpg'
  return ext
}

export const isAllowedPhotoExtension = (filename?: string) =>
  ALLOWED_PHOTO_EXTENSIONS.has(resolvePhotoExtension(filename))

export const isAllowedDocumentExtension = (filename?: string) =>
  ALLOWED_DOCUMENT_EXTENSIONS.has(resolvePhotoExtension(filename))

export const getUploadsDir = () => {
  const config = useRuntimeConfig()
  return config.uploadsDir || join(process.cwd(), '.data', 'uploads')
}

const getS3Config = () => {
  const config = useRuntimeConfig()

  return {
    bucket: (config.s3Bucket as string)?.trim() ?? '',
    region: (config.s3Region as string)?.trim() || 'ru-central1',
    accessKey: (config.s3AccessKey as string)?.trim() ?? '',
    secretKey: (config.s3SecretKey as string)?.trim() ?? '',
    endpoint: (config.s3Endpoint as string)?.trim() ?? '',
    publicUrl: (config.s3PublicUrl as string)?.trim().replace(/\/$/, '') ?? '',
  }
}

export const isS3StorageEnabled = () => Boolean(getS3Config().bucket)

let s3Client: S3Client | null = null

const getS3Client = () => {
  if (s3Client) {
    return s3Client
  }

  const { region, accessKey, secretKey, endpoint } = getS3Config()

  s3Client = new S3Client({
    region,
    credentials: accessKey && secretKey
      ? { accessKeyId: accessKey, secretAccessKey: secretKey }
      : undefined,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  })

  return s3Client
}

const buildPublicUrl = (key: string) => {
  const { bucket, region, endpoint, publicUrl } = getS3Config()

  if (publicUrl) {
    return `${publicUrl}/${key}`
  }

  if (endpoint) {
    return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

const saveListingPhotoLocal = async (listingId: string, filename: string, data: Buffer) => {
  const dir = join(getUploadsDir(), 'listings', listingId)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), data)
  return `/uploads/listings/${listingId}/${filename}`
}

const saveListingPhotoS3 = async (listingId: string, filename: string, data: Buffer, contentType?: string) => {
  const { bucket } = getS3Config()
  const key = `listings/${listingId}/${filename}`

  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: contentType || 'application/octet-stream',
  }))

  return buildPublicUrl(key)
}

export const saveListingPhoto = async (listingId: string, file: { data: Buffer, filename?: string, type?: string }) => {
  const ext = resolvePhotoExtension(file.filename)

  if (!ALLOWED_PHOTO_EXTENSIONS.has(ext)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported file type' })
  }

  const filename = `${randomUUID()}${ext}`

  if (isS3StorageEnabled()) {
    return saveListingPhotoS3(listingId, filename, file.data, file.type)
  }

  return saveListingPhotoLocal(listingId, filename, file.data)
}

const saveListingDocumentLocal = async (listingId: string, filename: string, data: Buffer) => {
  const dir = join(getUploadsDir(), 'listings', listingId, 'documents')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), data)
  return `/uploads/listings/${listingId}/documents/${filename}`
}

const saveListingDocumentS3 = async (listingId: string, filename: string, data: Buffer, contentType?: string) => {
  const { bucket } = getS3Config()
  const key = `listings/${listingId}/documents/${filename}`

  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: contentType || 'application/octet-stream',
  }))

  return buildPublicUrl(key)
}

export const saveListingDocument = async (listingId: string, file: { data: Buffer, filename?: string, type?: string }) => {
  const ext = resolvePhotoExtension(file.filename)

  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported document type' })
  }

  const filename = `${randomUUID()}${ext}`

  if (isS3StorageEnabled()) {
    return saveListingDocumentS3(listingId, filename, file.data, file.type)
  }

  return saveListingDocumentLocal(listingId, filename, file.data)
}

const saveClaimAttachmentLocal = async (claimId: string, filename: string, data: Buffer) => {
  const dir = join(getUploadsDir(), 'claims', claimId)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), data)
  return `/uploads/claims/${claimId}/${filename}`
}

const saveClaimAttachmentS3 = async (claimId: string, filename: string, data: Buffer, contentType?: string) => {
  const { bucket } = getS3Config()
  const key = `claims/${claimId}/${filename}`

  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: contentType || 'application/octet-stream',
  }))

  return buildPublicUrl(key)
}

export const saveClaimAttachment = async (claimId: string, file: { data: Buffer, filename?: string, type?: string }) => {
  const ext = resolvePhotoExtension(file.filename)

  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported attachment type' })
  }

  const filename = `${randomUUID()}${ext}`

  if (isS3StorageEnabled()) {
    return saveClaimAttachmentS3(claimId, filename, file.data, file.type)
  }

  return saveClaimAttachmentLocal(claimId, filename, file.data)
}

const saveReviewPhotoLocal = async (reviewId: string, filename: string, data: Buffer) => {
  const dir = join(getUploadsDir(), 'reviews', reviewId)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), data)
  return `/uploads/reviews/${reviewId}/${filename}`
}

const saveReviewPhotoS3 = async (reviewId: string, filename: string, data: Buffer, contentType?: string) => {
  const { bucket } = getS3Config()
  const key = `reviews/${reviewId}/${filename}`

  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: contentType || 'application/octet-stream',
  }))

  return buildPublicUrl(key)
}

const saveSpotlightPhotoLocal = async (photoId: string, filename: string, data: Buffer) => {
  const dir = join(getUploadsDir(), 'spotlight', photoId)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), data)
  return `/uploads/spotlight/${photoId}/${filename}`
}

const saveSpotlightPhotoS3 = async (photoId: string, filename: string, data: Buffer, contentType?: string) => {
  const { bucket } = getS3Config()
  const key = `spotlight/${photoId}/${filename}`

  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: contentType || 'application/octet-stream',
  }))

  return buildPublicUrl(key)
}

export const saveSpotlightPhoto = async (photoId: string, file: { data: Buffer, filename?: string, type?: string }) => {
  const ext = resolvePhotoExtension(file.filename)

  if (!ALLOWED_PHOTO_EXTENSIONS.has(ext)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported file type' })
  }

  const filename = `${randomUUID()}${ext}`

  if (isS3StorageEnabled()) {
    return saveSpotlightPhotoS3(photoId, filename, file.data, file.type)
  }

  return saveSpotlightPhotoLocal(photoId, filename, file.data)
}

const saveUserStoryLocal = async (storyId: string, filename: string, data: Buffer) => {
  const dir = join(getUploadsDir(), 'stories', storyId)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), data)
  return `/uploads/stories/${storyId}/${filename}`
}

const saveUserStoryS3 = async (storyId: string, filename: string, data: Buffer, contentType?: string) => {
  const { bucket } = getS3Config()
  const key = `stories/${storyId}/${filename}`

  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: contentType || 'application/octet-stream',
  }))

  return buildPublicUrl(key)
}

export const saveUserStory = async (
  storyId: string,
  file: { data: Buffer, filename?: string, type?: string },
  mediaType: 'image' | 'video' = 'image',
) => {
  const ext = mediaType === 'video'
    ? extname(file.filename ?? '.mp4').toLowerCase() || '.mp4'
    : resolvePhotoExtension(file.filename)

  const allowed = mediaType === 'video' ? ALLOWED_STORY_VIDEO_EXTENSIONS : ALLOWED_PHOTO_EXTENSIONS

  if (!allowed.has(ext)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported file type' })
  }

  const filename = `${randomUUID()}${ext}`

  if (isS3StorageEnabled()) {
    return saveUserStoryS3(storyId, filename, file.data, file.type)
  }

  return saveUserStoryLocal(storyId, filename, file.data)
}

const saveListingNewsMediaLocal = async (newsId: string, filename: string, data: Buffer) => {
  const dir = join(getUploadsDir(), 'listing-news', newsId)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), data)
  return `/uploads/listing-news/${newsId}/${filename}`
}

const saveListingNewsMediaS3 = async (newsId: string, filename: string, data: Buffer, contentType?: string) => {
  const { bucket } = getS3Config()
  const key = `listing-news/${newsId}/${filename}`

  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: contentType || 'application/octet-stream',
  }))

  return buildPublicUrl(key)
}

export const saveListingNewsMedia = async (
  newsId: string,
  file: { data: Buffer, filename?: string, type?: string },
  mediaType: 'photo' | 'video' = 'photo',
) => {
  const ext = mediaType === 'video'
    ? extname(file.filename ?? '.mp4').toLowerCase() || '.mp4'
    : resolvePhotoExtension(file.filename)

  const allowed = mediaType === 'video' ? ALLOWED_STORY_VIDEO_EXTENSIONS : ALLOWED_PHOTO_EXTENSIONS

  if (!allowed.has(ext)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported file type' })
  }

  const filename = `${randomUUID()}${ext}`

  if (isS3StorageEnabled()) {
    return saveListingNewsMediaS3(newsId, filename, file.data, file.type)
  }

  return saveListingNewsMediaLocal(newsId, filename, file.data)
}

export const saveReviewPhoto = async (reviewId: string, file: { data: Buffer, filename?: string, type?: string }) => {
  const ext = resolvePhotoExtension(file.filename)

  if (!ALLOWED_PHOTO_EXTENSIONS.has(ext)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported file type' })
  }

  const filename = `${randomUUID()}${ext}`

  if (isS3StorageEnabled()) {
    return saveReviewPhotoS3(reviewId, filename, file.data, file.type)
  }

  return saveReviewPhotoLocal(reviewId, filename, file.data)
}
