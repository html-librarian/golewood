import { buildListingJsonLd, resolveSiteUrl } from '#shared/utils/seo'

interface SiteSeoOptions {
  title?: string
  description?: string
  path?: string
  image?: string | null
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

export const useSiteSeo = (options: SiteSeoOptions = {}) => {
  const { t, locale } = useI18n()
  const config = useRuntimeConfig()
  const route = useRoute()
  const siteUrl = config.public.siteUrl.replace(/\/$/, '')

  const title = options.title ?? t('seo.defaultTitle')
  const description = options.description ?? t('seo.defaultDescription')
  const path = options.path ?? route.path
  const canonical = `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
  const image = options.image ? resolveSiteUrl(options.image, siteUrl) : undefined

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: 'website',
    ogUrl: canonical,
    ogLocale: locale.value === 'ru' ? 'ru_RU' : 'en_US',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    ...(image
      ? {
          ogImage: image,
          ogImageAlt: title,
          twitterImage: image,
        }
      : {}),
  })

  useHead({
    link: [{ rel: 'canonical', href: canonical }],
    ...(options.jsonLd
      ? {
          script: [{
            type: 'application/ld+json',
            innerHTML: JSON.stringify(options.jsonLd),
          }],
        }
      : {}),
  })
}

export { buildListingJsonLd, resolveSiteUrl }
