<script setup lang="ts">
import { AMENITY_LABELS, CANCELLATION_POLICY_LABELS } from '#shared/types/listing'
import type { ReviewRatings } from '#shared/types/review-ratings'
import type { ListingSectionNavItem } from '~/components/listing/section-nav/types'
import { formatPrice } from '#shared/utils/format'
import { getListingGuestCapacity } from '#shared/utils/listing-extra-guests'
import { buildYandexMapsUrl, hasValidMapCoordinates } from '#shared/utils/map-coordinates'
import { getReviewRatingLabel } from '#shared/utils/review-rating'
import { parseBookingRouteQuery } from '#shared/utils/booking-route-query'
import { buildListingMetaDescription, buildListingMetaTitle } from '#shared/utils/listing-seo'
import { resolveSiteUrl } from '#shared/utils/seo'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t, locale } = usePageI18n({ ru, en })
const { t: tReview } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { isAuthenticated, user, accessToken } = useAuth()
const { fetchPublishedById } = useListings()
const { createBooking } = useBookings()
const {
  fetchListingReviews,
  fetchHostListingReviews,
  fetchReviewEligibility,
  createReview,
  uploadReviewPhoto,
} = useReviews()
const { createReport } = useReports()
const { fetchFavoriteIds, addFavorite, removeFavorite } = useFavorites()
const { startConversation } = useConversations()
const { fetchListingStories } = useStories()
const { fetchListingNews } = useListingNews()
const { fetchBonusAccount } = useBonus()
const { fetchListingOffers } = useGiftCertificates()
const { fetchAmenities } = useCatalog()

const checkIn = ref('')
const checkOut = ref('')
const guests = ref(2)
const includeTransfer = ref(false)
const bonusToApply = ref(0)
const giftCertificateCode = ref('')
const giftCertificateCredit = ref(0)
const bookingLoading = ref(false)
const bookingError = ref('')
const reviewLoading = ref(false)
const reviewSubmitted = ref(false)
const showReportForm = ref(false)
const reportLoading = ref(false)
const reportSubmitted = ref(false)
const hostVerificationModalOpen = ref(false)

const listingId = computed(() => String(route.params.id))

const applyBookingQueryFromRoute = () => {
  const { checkIn: inQ, checkOut: outQ, guests: guestsQ } = parseBookingRouteQuery(
    route.query as Record<string, unknown>,
  )

  if (inQ) {
    checkIn.value = inQ
  }

  if (outQ) {
    checkOut.value = outQ
  }

  if (guestsQ !== null) {
    guests.value = guestsQ
  }
}

applyBookingQueryFromRoute()

watch(() => route.query, () => {
  applyBookingQueryFromRoute()
})

watch(listingId, () => {
  giftCertificateCode.value = ''
  giftCertificateCredit.value = 0
  applyBookingQueryFromRoute()
})
const leaveReviewBookingId = computed(() => {
  const value = route.query.leaveReview

  return typeof value === 'string' && value.length > 0 ? value : undefined
})
const wantsLeaveReview = computed(() => leaveReviewBookingId.value !== undefined)
const reviewsSectionRef = ref<HTMLElement | null>(null)

const cancellationPolicyLabel = computed(() => {
  if (!listing.value) {
    return ''
  }

  const labels = CANCELLATION_POLICY_LABELS[listing.value.cancellationPolicy]
  return locale.value === 'en' ? labels.en : labels.ru
})

const { data: favoriteIds, refresh: refreshFavoriteIds } = await useAsyncData(
  () => `favorite-ids-${listingId.value}`,
  async () => {
    if (!accessToken.value) {
      return [] as string[]
    }

    const { ids } = await fetchFavoriteIds()
    return ids
  },
  { watch: [accessToken, isAuthenticated] },
)

const isFavorite = computed(() => favoriteIds.value?.includes(listingId.value) ?? false)
const favoriteLoading = ref(false)
const messageLoading = ref(false)
const storyViewerOpen = ref(false)
const storyViewerStart = ref(0)

const { data: pinnedStories, refresh: refreshPinnedStories } = await useAsyncData(
  () => `listing-stories-${listingId.value}`,
  () => fetchListingStories(listingId.value),
)

const { data: giftOffers } = await useAsyncData(
  () => `listing-gift-offers-${listingId.value}`,
  async () => {
    try {
      return await fetchListingOffers(listingId.value)
    } catch {
      return []
    }
  },
)

const hasGiftOffers = computed(() => (giftOffers.value?.length ?? 0) > 0)

const openStoryViewer = (index: number) => {
  storyViewerStart.value = index
  storyViewerOpen.value = true
}

const isGuest = computed(() => user.value?.role === 'guest')

const isOwnListing = computed(() =>
  isAuthenticated.value && user.value?.id === listing.value?.hostId,
)

const isHostOwner = computed(() =>
  isOwnListing.value && (user.value?.role === 'host' || user.value?.role === 'admin'),
)

const hostToolbarLabels = computed(() => ({
  title: t('hostToolbarTitle'),
  edit: t('hostToolbarEdit'),
  news: t('hostToolbarNews'),
  calendar: t('hostToolbarCalendar'),
  manage: t('hostToolbarManage'),
}))

const toggleFavorite = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(localePath('/auth/login'))
    return
  }

  favoriteLoading.value = true

  try {
    if (isFavorite.value) {
      await removeFavorite(listingId.value)
    } else {
      await addFavorite(listingId.value)
    }

    await refreshFavoriteIds()
  } finally {
    favoriteLoading.value = false
  }
}

const messageHost = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(localePath('/auth/login'))
    return
  }

  messageLoading.value = true

  try {
    const conversation = await startConversation({ listingId: listingId.value })
    await navigateTo(localePath(`/messages/${conversation.id}`))
  } finally {
    messageLoading.value = false
  }
}

const { data: listing, error, pending } = await useAsyncData(
  `listing-${route.params.id}`,
  () => fetchPublishedById(listingId.value),
)

useListingPageSeo(listing)

const listingFetchStatus = computed(() => {
  const err = error.value as { statusCode?: number, status?: number } | null

  return err?.statusCode ?? err?.status ?? null
})

const listingErrorHint = computed(() => {
  if (listingFetchStatus.value === 404) {
    return t('notFoundHint')
  }

  return t('loadErrorHint')
})

const guestCapacity = computed(() =>
  listing.value ? getListingGuestCapacity(listing.value) : 1,
)

const isTeamListing = computed(() => Boolean(listing.value?.managedByTeam))
const isPropertyComplex = computed(() => listing.value?.kind === 'property')
const propertyUnits = computed(() => listing.value?.units ?? [])

const propertyUnitsLabels = computed(() => ({
  title: t('unitsTitle'),
  empty: t('unitsEmpty'),
  pricePerNight: t('pricePerNight'),
  guests: t('guests'),
  bedrooms: t('bedrooms'),
  choose: t('unitsChoose'),
  book: t('unitsBook'),
  unavailable: t('unitsUnavailable'),
  loadingOffers: t('unitsLoadingOffers'),
  forNights: t('unitsForNights'),
}))

const checkInOutLabels = computed(() => ({
  title: t('checkInOutTitle'),
  checkIn: t('checkInLabel'),
  checkOut: t('checkOutLabel'),
}))

const claimLabels = computed(() => ({
  title: t('claimTitle'),
  subtitle: t('claimSubtitle'),
  teamBadge: t('teamListingBadge'),
  name: t('claimName'),
  phone: t('claimPhone'),
  email: t('claimEmail'),
  message: t('claimMessage'),
  attachments: t('claimAttachments'),
  attachmentsHint: t('claimAttachmentsHint'),
  submit: t('claimSubmit'),
  success: t('claimSuccess'),
  error: t('claimError'),
}))

const capacityLabel = computed(() => {
  if (!listing.value) {
    return ''
  }

  if (listing.value.kind === 'property') {
    const unitsCount = propertyUnits.value.length

    return unitsCount > 0
      ? t('propertyCapacityMeta', { guests: listing.value.maxGuests, units: unitsCount })
      : t('propertyCapacityGuestsOnly', { guests: listing.value.maxGuests })
  }

  if (listing.value.extraGuestsOffered && listing.value.maxGuestsWithExtra) {
    return t('guestsCapacityExtended', {
      included: listing.value.maxGuests,
      max: listing.value.maxGuestsWithExtra,
    })
  }

  return `${listing.value.maxGuests} ${t('guests')} · ${listing.value.bedrooms} ${t('bedrooms')}`
})

watch(guestCapacity, (capacity) => {
  if (guests.value > capacity) {
    guests.value = capacity
  }
})

const { data: bonusAccount, refresh: refreshBonusAccount } = await useAsyncData(
  () => `listing-bonus-${user.value?.id ?? 'anon'}`,
  async () => {
    if (!accessToken.value) {
      return null
    }

    return fetchBonusAccount()
  },
  { watch: [accessToken, user] },
)

const bonusBalance = computed(() => bonusAccount.value?.balance ?? user.value?.bonusBalance ?? 0)

const { data: hostNews } = await useAsyncData(
  () => `listing-news-${listingId.value}`,
  () => fetchListingNews(listingId.value),
  { watch: [listingId] },
)

const teamBadgeHref = computed(() => {
  const firstNews = hostNews.value?.[0]

  if (firstNews) {
    return localePath(`/listings/${listingId.value}/news/${firstNews.id}`)
  }

  const blogSlug = listing.value?.teamBadgeBlogPost?.slug

  if (blogSlug) {
    return localePath(`/blog/${blogSlug}`)
  }

  return undefined
})

const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl.replace(/\/$/, '')

const shareUrl = computed(() => {
  if (!listing.value) {
    return ''
  }

  return resolveSiteUrl(localePath(`/listings/${listing.value.id}`), siteUrl)
})

const shareImageUrl = computed(() => {
  const cover = listing.value?.photos[0]?.url

  if (!cover) {
    return null
  }

  return resolveSiteUrl(cover, siteUrl)
})

const shareTitle = computed(() =>
  listing.value
    ? buildListingMetaTitle(listing.value, locale.value === 'en' ? 'en' : 'ru')
    : '',
)

const shareDescription = computed(() =>
  listing.value
    ? buildListingMetaDescription(listing.value, locale.value === 'en' ? 'en' : 'ru')
    : '',
)

const { data: reviewsData, refresh: refreshReviews } = await useAsyncData(
  () => `listing-reviews-${listingId.value}`,
  () => fetchListingReviews(listingId.value),
)

const { data: hostReviewsData, refresh: refreshHostReviews } = await useAsyncData(
  () => `host-listing-reviews-${listingId.value}`,
  async () => {
    if (!isHostOwner.value || !accessToken.value) {
      return null
    }

    return fetchHostListingReviews(listingId.value)
  },
  { watch: [isHostOwner, accessToken, listingId] },
)

const displayedReviews = computed(() =>
  hostReviewsData.value?.approved ?? reviewsData.value?.reviews ?? [],
)

const pendingHostReviews = computed(() => hostReviewsData.value?.pending ?? [])

const replyLabels = computed(() => ({
  host: t('review.replyHost'),
  guest: t('review.replyGuest'),
  reply: t('review.replyAction'),
  replyPlaceholder: t('review.replyPlaceholder'),
  submit: t('review.replySubmit'),
}))

const canReplyAsHost = computed(() => isHostOwner.value)

const canReplyToReply = (review: { authorId: string }) => (reply: { authorRole: 'host' | 'guest' }) => {
  if (reply.authorRole === 'host') {
    return Boolean(user.value?.id && user.value.id === review.authorId)
  }

  return isHostOwner.value
}

const refreshAllReviews = async () => {
  await refreshReviews()
  await refreshHostReviews()
}

const { data: eligibility, refresh: refreshEligibility } = await useAsyncData(
  () => `review-eligibility-${listingId.value}-${user.value?.id ?? 'anon'}-${leaveReviewBookingId.value ?? ''}`,
  async () => {
    if (!accessToken.value) {
      return { bookingId: null as string | null }
    }

    return fetchReviewEligibility(listingId.value, leaveReviewBookingId.value)
  },
  {
    watch: [accessToken, listingId, user, leaveReviewBookingId],
  },
)

const showReviewLoginHint = computed(() => wantsLeaveReview.value && !isAuthenticated.value)
const showReviewAlreadyLeftHint = computed(() =>
  wantsLeaveReview.value
  && isAuthenticated.value
  && !eligibility.value?.bookingId
  && !reviewSubmitted.value
  && eligibility.value?.reason === 'already_reviewed',
)

const showReviewNotEligibleHint = computed(() =>
  wantsLeaveReview.value
  && isAuthenticated.value
  && !eligibility.value?.bookingId
  && !reviewSubmitted.value
  && eligibility.value?.reason !== 'already_reviewed',
)

const scrollToReviewsSection = () => {
  reviewsSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(
  () => eligibility.value?.bookingId,
  (bookingId) => {
    if (bookingId && wantsLeaveReview.value) {
      nextTick(() => scrollToReviewsSection())
    }
  },
)

onMounted(() => {
  if (isAuthenticated.value && wantsLeaveReview.value) {
    void refreshEligibility()
  }
})

const handleReviewSubmit = async (payload: { ratings: ReviewRatings, text: string, photos: File[] }) => {
  const bookingId = eligibility.value?.bookingId

  if (!bookingId) {
    return
  }

  reviewLoading.value = true

  try {
    const review = await createReview(bookingId, {
      ratings: payload.ratings,
      text: payload.text,
    })

    for (const file of payload.photos) {
      await uploadReviewPhoto(review.id, file)
    }

    reviewSubmitted.value = true
    await refreshAllReviews()
    eligibility.value = { bookingId: null }
  } finally {
    reviewLoading.value = false
  }
}

const handleReportSubmit = async (reason: string) => {
  if (!listing.value) {
    return
  }

  if (!isAuthenticated.value) {
    await navigateTo(localePath('/auth/login'))
    return
  }

  reportLoading.value = true

  try {
    await createReport({
      type: 'listing',
      listingId: listing.value.id,
      reason,
    })
    reportSubmitted.value = true
    showReportForm.value = false
  } finally {
    reportLoading.value = false
  }
}

const handleBook = async () => {
  if (!listing.value || !isAuthenticated.value) {
    await navigateTo(localePath('/auth/login'))
    return
  }

  bookingLoading.value = true
  bookingError.value = ''

  try {
    const booking = await createBooking({
      listingId: listing.value.id,
      checkIn: checkIn.value,
      checkOut: checkOut.value,
      guests: guests.value,
      includeTransfer: includeTransfer.value,
      bonusToApply: bonusToApply.value,
      ...(giftCertificateCredit.value > 0 && giftCertificateCode.value
        ? { giftCertificateCode: giftCertificateCode.value }
        : {}),
    })
    bonusToApply.value = 0
    giftCertificateCode.value = ''
    giftCertificateCredit.value = 0
    await refreshBonusAccount()
    await navigateTo(localePath(`/bookings/${booking.id}/pay`))
  } catch {
    bookingError.value = t('bookingFailed')
  } finally {
    bookingLoading.value = false
  }
}

const bookingPanelRef = ref<HTMLElement | null>(null)
const photosSectionRef = ref<HTMLElement | null>(null)

const sectionNavItems = computed<ListingSectionNavItem[]>(() => {
  if (!listing.value) {
    return []
  }

  const items: ListingSectionNavItem[] = [
    { id: 'listing-photos', label: t('navPhotos') },
    { id: 'listing-description', label: t('navDescription') },
    { id: 'listing-check-in-out', label: t('navCheckInOut') },
  ]

  if (hostNews.value?.length) {
    items.push({ id: 'listing-news', label: t('navNews') })
  }

  if (listing.value.amenities.length) {
    items.push({ id: 'listing-amenities', label: t('navAmenities') })
  }

  if (listing.value.houseRules) {
    items.push({ id: 'listing-rules', label: t('navRules') })
  }

  if (listing.value.documents?.length) {
    items.push({ id: 'listing-documents', label: t('navDocuments') })
  }

  if (hasValidMapCoordinates(listing.value.latitude, listing.value.longitude)) {
    items.push({ id: 'listing-map', label: t('navMap') })
  }

  items.push({ id: 'reviews', label: t('navReviews') })

  return items
})

const { visible: sectionNavVisible, activeId: activeSectionId, scrollToSection } = useListingSectionNav(
  sectionNavItems,
  photosSectionRef,
)

const scrollToBookingPanel = () => {
  if (isPropertyComplex.value) {
    document.getElementById('listing-property-units')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    return
  }

  const panel = bookingPanelRef.value ?? document.getElementById('booking-panel')
  panel?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const showListingMap = computed(() =>
  listing.value
    ? hasValidMapCoordinates(listing.value.latitude, listing.value.longitude)
    : false,
)

const listingMapUrl = computed(() => {
  if (!listing.value || !showListingMap.value) {
    return ''
  }

  return buildYandexMapsUrl(listing.value.latitude, listing.value.longitude)
})

const listingMapLabel = computed(() => {
  if (!listing.value) {
    return ''
  }

  const parts = [listing.value.city, listing.value.address].filter(Boolean)

  return parts.join(', ')
})

const { data: amenityCatalog } = await useAsyncData(
  () => `listing-amenity-catalog-${listingId.value}`,
  () => fetchAmenities(),
)

const overviewReviewScore = computed(() => reviewsData.value?.ratingBreakdown?.overall ?? null)

const overviewReviewLabel = computed(() => {
  if (overviewReviewScore.value === null) {
    return null
  }

  return getReviewRatingLabel(overviewReviewScore.value, locale.value)
})

const overviewReviewCount = computed(() => reviewsData.value?.totalCount ?? 0)

const overviewAmenities = computed(() => {
  if (!listing.value) {
    return []
  }

  const catalog = amenityCatalog.value ?? []

  return listing.value.amenities.slice(0, 6).map((slug) => {
    const item = catalog.find(entry => entry.slug === slug)
    const legacy = AMENITY_LABELS[slug as keyof typeof AMENITY_LABELS]

    return {
      slug,
      icon: item?.icon ?? 'ph:check-circle-duotone',
      label: item
        ? (locale.value === 'en' ? item.labelEn : item.labelRu)
        : (legacy?.[locale.value as 'ru' | 'en'] ?? slug),
    }
  })
})

const showDatesPrompt = computed(() =>
  Boolean(
    listing.value
    && !isOwnListing.value
    && !isTeamListing.value
    && !isPropertyComplex.value
    && (!checkIn.value || !checkOut.value),
  ),
)

const showHeaderPriceCta = computed(() =>
  Boolean(listing.value && !isTeamListing.value && !isPropertyComplex.value),
)

const headerPricePerNight = computed(() => {
  if (!listing.value) {
    return 0
  }

  return listing.value.kind === 'property'
    ? (listing.value.priceFrom ?? listing.value.pricePerNight)
    : listing.value.pricePerNight
})
</script>

<template>
  <div
    class="page-container listing-detail-page"
    :class="{ 'listing-booking-offset': listing }"
  >
    <ListingDetailSkeleton v-if="pending && !listing && !error" />

    <UiEmpty
      v-else-if="error"
      icon="ph:house-line-duotone"
      :title="listingFetchStatus === 404 ? t('notFound') : t('loadError')"
      :description="listingErrorHint"
    >
      <NuxtLink :to="localePath('/search')">
        <UiButton>{{ t('explore') }}</UiButton>
      </NuxtLink>
    </UiEmpty>

    <div
      v-else-if="listing"
      class="grid items-start gap-8 lg:gap-10"
      :class="isTeamListing || isPropertyComplex ? '' : 'lg:grid-cols-[1fr_340px]'"
    >
      <article class="min-w-0 space-y-8 pb-4 lg:pb-16">
        <div
          v-show="!sectionNavVisible"
          class="flex flex-wrap items-center justify-end gap-2"
        >
          <ListingShare
            :url="shareUrl"
            :title="shareTitle"
            :image-url="shareImageUrl"
          />
          <UiButton
            variant="outline"
            size="sm"
            :disabled="favoriteLoading"
            @click="toggleFavorite"
          >
            <Icon
              :name="isFavorite ? 'ph:heart-fill' : 'ph:heart-duotone'"
              class="mr-1.5 size-4"
              :class="isFavorite ? 'text-red-500' : ''"
            />
            {{ isFavorite ? t('removeFavorite') : t('addFavorite') }}
          </UiButton>
        </div>

        <ListingSectionNav
          :items="sectionNavItems"
          :active-id="activeSectionId"
          :visible="sectionNavVisible"
          @select="scrollToSection"
        >
          <template #actions>
            <ListingShare
              :url="shareUrl"
              :title="shareTitle"
              :image-url="shareImageUrl"
            />
            <UiButton
              variant="outline"
              size="sm"
              :disabled="favoriteLoading"
              @click="toggleFavorite"
            >
              <Icon
                :name="isFavorite ? 'ph:heart-fill' : 'ph:heart-duotone'"
                class="size-4"
                :class="isFavorite ? 'text-red-500' : ''"
              />
            </UiButton>
          </template>
        </ListingSectionNav>

        <header class="space-y-4">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div class="min-w-0 flex-1 space-y-2">
              <div class="flex flex-wrap items-start gap-3">
                <h1 class="min-w-0 flex-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl md:text-4xl dark:text-stone-50">
                  {{ listing.title }}
                </h1>
                <ListingTeamBadgeLink
                  v-if="listing.teamBadge"
                  :badge="listing.teamBadge"
                  :to="teamBadgeHref"
                  size="md"
                  class="shrink-0"
                />
              </div>
              <p class="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                <Icon
                  name="ph:map-pin-duotone"
                  class="size-4 shrink-0 text-brand-600 dark:text-brand-400"
                />
                {{ listing.city }}<span v-if="listing.address">, {{ listing.address }}</span>
              </p>
              <p class="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                <Icon
                  name="ph:users-duotone"
                  class="size-4 shrink-0"
                  aria-hidden="true"
                />
                {{ capacityLabel }}
              </p>
            </div>

            <div
              v-if="showHeaderPriceCta"
              class="flex shrink-0 flex-col items-stretch gap-2 sm:items-end lg:min-w-[200px] lg:text-right"
            >
              <p class="text-sm text-stone-500 dark:text-stone-400">
                <span
                  v-if="listing.kind === 'property' && listing.priceFrom"
                  class="mr-1"
                >{{ t('priceFrom') }}</span>
                <span class="text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
                  {{ formatPrice(headerPricePerNight) }}
                </span>
                <span class="ml-1 text-base font-normal">{{ t('pricePerNight') }}</span>
              </p>
              <UiButton
                type="button"
                class="w-full sm:w-auto lg:ml-auto"
                @click="scrollToBookingPanel"
              >
                {{ t('showPrices') }}
              </UiButton>
            </div>
          </div>

          <StoryRing
            v-if="pinnedStories?.length"
            :stories="pinnedStories"
            :label="t('guestStories')"
            @open="openStoryViewer"
          />

          <StoryUpload
            v-if="isAuthenticated && isGuest && !isOwnListing"
            :listing-id="listing.id"
            @uploaded="refreshPinnedStories()"
          />

          <StoryViewer
            v-if="pinnedStories?.length"
            :stories="pinnedStories"
            :start-index="storyViewerStart"
            :open="storyViewerOpen"
            @update:open="storyViewerOpen = $event"
          />
        </header>

        <p
          v-if="isTeamListing"
          class="rounded-xl border border-brand-200/80 bg-brand-50/60 px-4 py-3 text-sm text-brand-900 dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-100"
        >
          {{ t('teamListingNotice') }}
        </p>

        <ListingHostToolbar
          v-if="isHostOwner && !isTeamListing"
          :listing-id="listing.id"
          :labels="hostToolbarLabels"
        />

        <section
          id="listing-photos"
          ref="photosSectionRef"
          class="scroll-mt-32"
        >
          <ListingGallery
            :photos="listing.photos"
            :title="listing.title"
            layout="mosaic"
          />
        </section>

        <ListingOverviewStrip
          v-if="!isTeamListing"
          :review-score="overviewReviewScore"
          :review-label="overviewReviewLabel"
          :review-count="overviewReviewCount"
          :amenities="overviewAmenities"
          :city="listing.city"
          :address="listing.address"
          :has-map="showListingMap"
          @scroll-to-reviews="scrollToSection('reviews')"
          @scroll-to-amenities="scrollToSection('listing-amenities')"
          @scroll-to-map="scrollToSection('listing-map')"
        />

        <ListingDatesPrompt
          v-if="showDatesPrompt"
          :price-per-night="listing.pricePerNight"
          @select-dates="scrollToBookingPanel"
        />

        <template v-if="isPropertyComplex">
          <ListingPropertyBookingFields
            v-model:check-in="checkIn"
            v-model:check-out="checkOut"
            v-model:guests="guests"
            class="scroll-mt-32"
            :title="t('unitsPickDates')"
          />

          <ListingPropertyUnits
            :property-id="listing.id"
            :units="propertyUnits"
            :check-in="checkIn"
            :check-out="checkOut"
            :guests="guests"
            :labels="propertyUnitsLabels"
          />
        </template>

        <div class="space-y-12 md:space-y-14">
          <div
            v-if="!isOwnListing"
            class="border-b border-stone-200 pb-8 dark:border-stone-800"
          >
            <NuxtLink
              :to="localePath(`/spotlight?listingId=${listing.id}`)"
              class="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <Icon
                name="ph:camera-duotone"
                class="size-5"
              />
              {{ t('addToSpotlight') }}
            </NuxtLink>
          </div>

        <section
          v-if="hostNews?.length"
          id="listing-news"
          class="scroll-mt-32 space-y-4"
        >
          <ListingNewsCarousel
            :items="hostNews"
            :listing-id="listing.id"
          />
        </section>

        <section
          v-if="showListingMap"
          id="listing-map"
          class="scroll-mt-32 space-y-4"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
              {{ t('locationTitle') }}
            </h2>
            <a
              :href="listingMapUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 sm:w-auto dark:bg-brand-600 dark:hover:bg-brand-500"
            >
              <Icon
                name="ph:map-trifold-duotone"
                class="size-5"
              />
              {{ t('openInMaps') }}
            </a>
          </div>

          <p
            v-if="listingMapLabel"
            class="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400"
          >
            <Icon
              name="ph:map-pin-duotone"
              class="size-4 shrink-0 text-brand-600 dark:text-brand-400"
            />
            {{ listingMapLabel }}
          </p>

          <p class="text-xs text-stone-500 dark:text-stone-400">
            {{ t('mapApproximate') }}
          </p>

          <MapLocation
            :latitude="listing.latitude"
            :longitude="listing.longitude"
            :label="listingMapLabel"
            class="h-[min(280px,45vh)] w-full md:h-[380px]"
          />
        </section>

        <section
          id="listing-description"
          class="scroll-mt-32 space-y-4"
        >
          <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
            {{ t('aboutTitle') }}
          </h2>
          <p class="max-w-3xl whitespace-pre-wrap leading-relaxed text-stone-700 dark:text-stone-300">
            {{ listing.description || $t('common.emDash') }}
          </p>
        </section>

        <ListingContactsBlock :contacts="listing.contacts" />

        <div
          class="scroll-mt-32 grid gap-4 sm:grid-cols-2"
        >
          <ListingCheckInOut
            :check-in-time="listing.checkInTime"
            :check-out-time="listing.checkOutTime"
            :labels="checkInOutLabels"
          />

          <section class="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <h2 class="text-sm font-semibold text-stone-900 dark:text-stone-50">
              {{ t('cancellationPolicy') }}
            </h2>
            <p class="mt-2 flex items-start gap-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              <Icon
                name="ph:shield-check-duotone"
                class="mt-0.5 size-5 shrink-0 text-brand-600 dark:text-brand-400"
              />
              {{ cancellationPolicyLabel }}
            </p>
          </section>
        </div>

        <section
          v-if="listing.transferOffered"
          class="scroll-mt-32 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
        >
          <h2 class="text-sm font-semibold text-stone-900 dark:text-stone-50">
            {{ t('transferTitle') }}
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            <template v-if="listing.transferPriceOnRequest">
              {{ t('transferOnRequest') }}
            </template>
            <template v-else-if="listing.transferPrice">
              {{ t('transferFixed', { price: formatPrice(listing.transferPrice) }) }}
            </template>
          </p>
        </section>

        <section
          v-if="listing.amenities.length"
          id="listing-amenities"
          class="scroll-mt-32 space-y-5"
        >
          <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
            {{ t('servicesTitle') }}
          </h2>
          <ListingAmenitiesGrouped :amenities="listing.amenities" />
        </section>

        <section
          v-if="listing.houseRules"
          id="listing-rules"
          class="scroll-mt-32 space-y-4"
        >
          <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
            {{ t('houseRules') }}
          </h2>
          <p class="whitespace-pre-wrap leading-relaxed text-stone-700 dark:text-stone-300">
            {{ listing.houseRules }}
          </p>
        </section>

        <section
          v-if="listing.documents?.length"
          id="listing-documents"
          class="scroll-mt-32 space-y-4"
        >
          <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
            {{ t('documents') }}
          </h2>
          <ul class="space-y-2">
            <li
              v-for="doc in listing.documents"
              :key="doc.id"
            >
              <a
                :href="doc.fileUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
              >
                <Icon
                  name="ph:file-pdf-duotone"
                  class="size-5 shrink-0"
                />
                {{ doc.title }}
              </a>
            </li>
          </ul>
        </section>

        <section
          id="reviews"
          ref="reviewsSectionRef"
          class="scroll-mt-32 space-y-6 lg:pb-4"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
              aria-hidden="true"
            >
              <Icon
                name="ph:chat-circle-text-duotone"
                class="size-5"
              />
            </span>
            <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
              {{ t('reviews') }}
            </h2>
          </div>

          <p
            v-if="showReviewLoginHint"
            class="rounded-xl border border-stone-200/80 bg-stone-50 px-4 py-3 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
            data-testid="review-login-hint"
          >
            {{ t('reviewLoginRequired') }}
            <NuxtLink
              :to="localePath('/auth/login')"
              class="ml-1 font-medium text-brand-700 underline dark:text-brand-400"
            >
              {{ $t('nav.login') }}
            </NuxtLink>
          </p>

          <p
            v-else-if="showReviewNotEligibleHint"
            class="rounded-xl border border-stone-200/80 bg-stone-50 px-4 py-3 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
            data-testid="review-not-eligible-hint"
          >
            {{ t('reviewNotEligible') }}
          </p>

          <p
            v-else-if="showReviewAlreadyLeftHint"
            class="rounded-xl border border-stone-200/80 bg-stone-50 px-4 py-3 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
            data-testid="review-already-left-hint"
          >
            {{ t('reviewAlreadyLeft') }}
          </p>

          <ReviewRatingSummary
            v-if="reviewsData?.ratingBreakdown && reviewsData.totalCount"
            :breakdown="reviewsData.ratingBreakdown"
            :total-count="reviewsData.totalCount"
          />

          <p
            v-if="reviewSubmitted"
            data-testid="review-success"
            class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
          >
            {{ t('reviewSubmitted') }}
          </p>

          <ReviewForm
            v-else-if="eligibility?.bookingId"
            :loading="reviewLoading"
            @submit-review="handleReviewSubmit"
          />

          <div
            v-if="isHostOwner && pendingHostReviews.length"
            class="space-y-4"
          >
            <div>
              <h3 class="text-base font-semibold text-stone-900 dark:text-stone-50">
                {{ tReview('review.pendingReviewsTitle') }}
              </h3>
              <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {{ tReview('review.pendingReviewsHint') }}
              </p>
            </div>
            <ReviewCard
              v-for="pendingReview in pendingHostReviews"
              :key="`pending-${pendingReview.id}`"
              :review="pendingReview"
              show-pending-badge
            />
          </div>

          <div
            v-if="!displayedReviews.length && !pendingHostReviews.length"
            class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-200/90 bg-stone-50/50 px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900/40"
          >
            <Icon
              name="ph:chat-teardrop-dots-duotone"
              class="size-10 text-stone-300 dark:text-stone-600"
              aria-hidden="true"
            />
            <p class="text-sm text-stone-600 dark:text-stone-400">
              {{ t('noReviews') }}
            </p>
          </div>

          <div
            v-else
            class="space-y-4"
          >
            <ReviewCard
              v-for="review in displayedReviews"
              :key="review.id"
              :review="review"
              :reply-labels="replyLabels"
              :can-reply-to-review="canReplyAsHost"
              :can-reply-to-reply="canReplyToReply(review)"
              @refresh="refreshAllReviews()"
            />
          </div>
        </section>

        <section
          v-if="isAuthenticated && !isOwnListing"
          class="space-y-4 border-t border-stone-200 pt-10 lg:mt-4 lg:pb-2 dark:border-stone-800"
        >
          <p
            v-if="reportSubmitted"
            class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
          >
            {{ $t('report.submitted') }}
          </p>

          <template v-else>
            <button
              v-if="!showReportForm"
              type="button"
              class="text-sm text-stone-500 underline hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              @click="showReportForm = true"
            >
              {{ $t('report.reportListing') }}
            </button>

            <ReportForm
              v-else
              :loading="reportLoading"
              @submit="handleReportSubmit"
            />
          </template>
        </section>
        </div>
      </article>

      <aside
        v-if="isTeamListing"
        id="claim-panel"
        class="scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
      >
        <ListingClaimAccess
          :listing-id="listing.id"
          :labels="claimLabels"
        />
      </aside>

      <aside
        v-else-if="isPropertyComplex"
        id="booking-panel"
        class="scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
      >
        <div class="surface-card space-y-3 p-5">
          <p
            v-if="listing.priceFrom"
            class="text-2xl font-semibold text-stone-900 dark:text-stone-50"
          >
            {{ t('priceFrom') }} {{ formatPrice(listing.priceFrom) }}
            <span class="text-base font-normal text-stone-500 dark:text-stone-400">{{ t('pricePerNight') }}</span>
          </p>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{ t('propertyBookingHint') }}
          </p>
        </div>
      </aside>

      <aside
        v-else
        id="booking-panel"
        ref="bookingPanelRef"
        class="scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
      >
        <div class="surface-card space-y-4 p-5">
          <p class="text-2xl font-semibold text-stone-900 dark:text-stone-50">
            {{ formatPrice(listing.pricePerNight) }}
            <span class="text-base font-normal text-stone-500 dark:text-stone-400">{{ t('pricePerNight') }}</span>
          </p>

          <BookingCalendar
            v-model:check-in="checkIn"
            v-model:check-out="checkOut"
            :listing-id="listing.id"
          />

          <BookingSummary
            :listing-id="listing.id"
            :price-per-night="listing.pricePerNight"
            :check-in="checkIn"
            :check-out="checkOut"
            :guests="guests"
            :max-guests="guestCapacity"
            :max-guests-included="listing.maxGuests"
            :extra-guests-offered="listing.extraGuestsOffered"
            :extra-guest-price-per-night="listing.extraGuestPricePerNight"
            :transfer-offered="listing.transferOffered"
            :transfer-price="listing.transferPrice"
            :transfer-price-on-request="listing.transferPriceOnRequest"
            :include-transfer="includeTransfer"
            :bonus-balance="bonusBalance"
            :bonus-to-apply="bonusToApply"
            :show-gift-certificate="!isOwnListing"
            :gift-certificate-code="giftCertificateCode"
            :gift-certificate-credit="giftCertificateCredit"
            :loading="bookingLoading"
            @update:guests="guests = $event"
            @update:include-transfer="includeTransfer = $event"
            @update:bonus-to-apply="bonusToApply = $event"
            @update:gift-certificate-code="giftCertificateCode = $event"
            @update:gift-certificate-credit="giftCertificateCredit = $event"
            @book="handleBook()"
          />

          <p
            v-if="bookingError"
            class="text-sm text-red-600 dark:text-red-400"
          >
            {{ bookingError }}
          </p>

          <NuxtLink
            v-if="hasGiftOffers && !isOwnListing"
            :to="localePath(`/listings/${listingId}/gift-certificate`)"
            class="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:border-brand-300 hover:bg-brand-50 dark:border-stone-700 dark:text-stone-100 dark:hover:border-brand-700 dark:hover:bg-brand-950/40"
          >
            <Icon
              name="ph:gift-duotone"
              class="size-4 text-brand-600 dark:text-brand-400"
            />
            {{ t('giftCertificate') }}
          </NuxtLink>

          <div class="space-y-3 border-t border-stone-200 pt-4 dark:border-stone-800">
            <HostVerifiedBadge
              v-if="listing.hostVerification?.isVerified"
              :verification="listing.hostVerification"
              @open-details="hostVerificationModalOpen = true"
            />

            <UiButton
              v-if="!isOwnListing"
              variant="outline"
              size="sm"
              class="w-full"
              :loading="messageLoading"
              data-testid="message-host"
              @click="messageHost()"
            >
              <Icon
                name="ph:chat-circle-dots-duotone"
                class="mr-1.5 size-4"
              />
              {{ t('messageHost') }}
            </UiButton>

            <NuxtLink
              :to="localePath(`/hosts/${listing.hostId}`)"
              class="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <Icon
                name="ph:user-circle-duotone"
                class="size-5"
              />
              {{ t('viewHostProfile') }}
            </NuxtLink>
          </div>
        </div>
      </aside>
    </div>

    <HostVerificationModal
      v-if="listing?.hostVerification?.isVerified"
      v-model:open="hostVerificationModalOpen"
      :verification="listing.hostVerification"
    />

    <ListingBookingBar
      v-if="listing && !isTeamListing && !isPropertyComplex"
      :price-per-night="listing.pricePerNight"
      :check-in="checkIn"
      :check-out="checkOut"
      :guests="guests"
      :transfer-offered="listing.transferOffered"
      :transfer-price="listing.transferPrice"
      :transfer-price-on-request="listing.transferPriceOnRequest"
      :include-transfer="includeTransfer"
      :loading="bookingLoading"
      @book="scrollToBookingPanel()"
      @scroll-to-panel="scrollToBookingPanel()"
    />
  </div>
</template>
