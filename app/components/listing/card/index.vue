<script setup lang="ts">
import { resolveComponent } from 'vue'
import { formatPrice } from '#shared/utils/format'
import type { ListingCardProps } from './types'

const props = defineProps<ListingCardProps>()

const localePath = useLocalePath()
const { t, locale } = useI18n()
const NuxtLinkComponent = resolveComponent('NuxtLink')

const isPromoted = computed(() => Boolean(props.listing.promotions?.highlight))

const teamReviewExcerpt = computed(() => {
  if (locale.value === 'en') {
    return props.listing.teamReviewExcerptEn || props.listing.teamReviewExcerptRu
  }

  return props.listing.teamReviewExcerptRu || props.listing.teamReviewExcerptEn
})

const showOverlayBadges = computed(() =>
  Boolean(
    props.listing.hostVerified
    || props.listing.teamBadge
    || props.listing.managedByTeam
    || props.listing.promotions?.boost
    || props.listing.promotions?.cityPin,
  ),
)

const cardPrice = computed(() =>
  props.displayPricePerNight ?? props.listing.pricePerNight,
)

const showPrice = computed(() => {
  if (!props.preview) {
    return true
  }

  return (props.displayPricePerNight ?? 0) > 0
})

const cardClass = computed(() => [
  'surface-card-interactive group flex h-full w-full flex-col overflow-hidden border-0 ring-0',
  props.preview
    ? 'pointer-events-none shadow-(--shadow-card)'
    : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f5f2] active:scale-[0.99] dark:focus-visible:ring-offset-stone-950',
  isPromoted.value
    ? 'bg-linear-to-b from-brand-50/80 to-white dark:from-brand-950/40 dark:to-stone-900'
    : '',
])

const rootTag = computed(() => (props.preview ? 'article' : NuxtLinkComponent))

const listingHref = computed(() => localePath(`/listings/${props.listing.id}`))
</script>

<template>
  <component
    :is="rootTag"
    :to="preview ? undefined : listingHref"
    :class="cardClass"
    :data-testid="isPromoted ? 'listing-card-highlighted' : undefined"
  >
    <div class="relative aspect-4/3 w-full shrink-0 overflow-hidden bg-stone-100 dark:bg-stone-800">
      <span
        class="card-hover-glow"
        aria-hidden="true"
      />
      <ListingImage
        v-if="listing.coverPhoto"
        :src="listing.coverPhoto.url"
        :alt="listing.title"
        class="transition duration-700 ease-out group-hover:scale-[1.04]"
      />
      <ListingImagePlaceholder v-else />

      <div class="absolute inset-0 bg-linear-to-t from-stone-950/55 via-transparent to-transparent opacity-80" />

      <div
        v-if="showOverlayBadges"
        class="absolute inset-x-2.5 top-2.5 z-20 flex max-w-[calc(100%-1.25rem)] flex-wrap items-center gap-1"
      >
        <ListingPromotionBadges
          :host-verified="listing.hostVerified"
          :boost="listing.promotions?.boost"
          :city-pin="listing.promotions?.cityPin"
          overlay
        />
        <ListingTeamBadge
          v-if="listing.teamBadge"
          :badge="listing.teamBadge"
          overlay
        />
        <span
          v-if="listing.managedByTeam"
          class="inline-flex max-w-full items-center rounded-full bg-stone-900/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm dark:bg-stone-100/90 dark:text-stone-900"
        >
          {{ t('listing.teamCatalog') }}
        </span>
      </div>

      <div
        v-if="showPrice"
        class="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 p-3"
      >
        <p class="price-tag">
          <template v-if="listing.kind === 'property' && listing.priceFrom">
            {{ t('listing.priceFrom') }} {{ formatPrice(listing.priceFrom) }}
          </template>
          <template v-else>
            {{ formatPrice(cardPrice) }}
          </template>
          <span class="font-normal text-stone-500 dark:text-stone-400">{{ t('listing.perNight') }}</span>
        </p>

        <UiRatingPill
          v-if="listing.reviewCount"
          :score="listing.averageRating"
          :count="listing.reviewCount"
          size="sm"
        />
      </div>
    </div>

    <div class="space-y-2 p-4 pt-3">
      <p
        class="line-clamp-2 font-display text-base font-semibold leading-snug md:text-[1.05rem]"
        :class="isPromoted
          ? 'text-brand-900 dark:text-brand-100'
          : 'text-stone-900 dark:text-stone-50'"
      >
        {{ listing.title }}
      </p>
      <p class="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400">
        <Icon
          name="ph:map-pin-duotone"
          class="size-4 shrink-0 text-brand-600/80 dark:text-brand-400/80"
        />
        {{ listing.city }}
      </p>
      <p class="text-xs text-stone-500 dark:text-stone-500">
        {{ listing.maxGuests }} {{ t('listing.guests') }} · {{ listing.bedrooms }} {{ t('listing.bedrooms') }}
      </p>
      <p
        v-if="teamReviewExcerpt"
        class="line-clamp-2 border-t border-stone-100 pt-2 text-xs leading-relaxed text-brand-800/90 italic dark:border-stone-800 dark:text-brand-200/90"
      >
        «{{ teamReviewExcerpt }}»
      </p>
    </div>
  </component>
</template>
