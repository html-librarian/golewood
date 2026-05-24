import { buildListingJsonLd, resolveSiteUrl } from '#shared/utils/seo'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

export interface SiteSeoOptions {
  title?: string
  description?: string
  path?: string
  image?: string | null
  ogType?: 'website' | 'article' | 'profile'
  siteName?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

const resolveOptions = (input: MaybeRefOrGetter<SiteSeoOptions | null | undefined>) =>
  toValue(input) ?? {}

export const useSiteSeo = (options: MaybeRefOrGetter<SiteSeoOptions | null | undefined> = {}) => {
  const { t, locale } = useI18n()
  const config = useRuntimeConfig()
  const route = useRoute()
  const siteUrl = config.public.siteUrl.replace(/\/$/, '')
  const defaultSiteName = (config.public.siteName as string) || 'Golewood'
  const defaultOgImagePath = (config.public.defaultOgImage as string) || '/icon-512.png'

  const resolved = computed(() => resolveOptions(options))

  const title = computed(() => resolved.value.title ?? t('seo.defaultTitle'))
  const description = computed(() => resolved.value.description ?? t('seo.defaultDescription'))
  const path = computed(() => resolved.value.path ?? route.path)
  const canonical = computed(() => `${siteUrl}${path.value.startsWith('/') ? path.value : `/${path.value}`}`)
  const siteName = computed(() => resolved.value.siteName ?? defaultSiteName)
  const ogType = computed(() => resolved.value.ogType ?? 'website')

  const image = computed(() => {
    const raw = resolved.value.image

    if (raw) {
      return resolveSiteUrl(raw, siteUrl)
    }

    return resolveSiteUrl(defaultOgImagePath, siteUrl)
  })

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType,
    ogUrl: canonical,
    ogSiteName: siteName,
    ogLocale: computed(() => (locale.value === 'en' ? 'en_US' : 'ru_RU')),
    ogImage: image,
    ogImageAlt: title,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  })

  useHead({
    link: [{ rel: 'canonical', href: canonical }],
    meta: [
      { property: 'og:image:secure_url', content: image },
      { name: 'twitter:image:alt', content: title },
    ],
  })

  useHead(computed(() => {
    const jsonLd = resolved.value.jsonLd

    if (!jsonLd) {
      return {}
    }

    return {
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify(jsonLd),
      }],
    }
  }))
}

export { buildListingJsonLd, resolveSiteUrl }
