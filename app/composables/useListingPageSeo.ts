import type { ListingDetail } from '#shared/types/listing'
import { buildListingSeoPayload } from '#shared/utils/listing-seo'
import { resolveSiteUrl } from '#shared/utils/seo'
import type { Ref } from 'vue'

export const useListingPageSeo = (listing: Ref<ListingDetail | null | undefined>) => {
  const { locale } = useI18n()
  const config = useRuntimeConfig()
  const route = useRoute()
  const localePath = useLocalePath()

  const siteUrl = config.public.siteUrl.replace(/\/$/, '')
  const siteName = (config.public.siteName as string) || 'Golewood'
  const defaultOgImagePath = (config.public.defaultOgImage as string) || '/icon-512.png'

  const payload = computed(() => {
    const item = listing.value

    if (!item) {
      return null
    }

    const coverPhoto = item.photos.find(photo => photo.mediaType === 'photo') ?? item.photos[0]

    return buildListingSeoPayload(
      {
        id: item.id,
        title: item.title,
        description: item.description,
        city: item.city,
        pricePerNight: item.pricePerNight,
        maxGuests: item.maxGuests,
        metaTitle: item.metaTitle,
        metaDescription: item.metaDescription,
        coverPhotoUrl: coverPhoto?.url ?? null,
      },
      {
        siteUrl,
        siteName,
        locale: locale.value === 'en' ? 'en' : 'ru',
        path: localePath(`/listings/${item.id}`),
        defaultOgImagePath,
      },
    )
  })

  useSiteSeo(() => payload.value ?? {
    path: route.path,
    image: resolveSiteUrl(defaultOgImagePath, siteUrl),
  })

  return { payload }
}
