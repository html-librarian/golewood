<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import type { SearchResultCardProps } from './types'

const props = defineProps<SearchResultCardProps>()

const localePath = useLocalePath()
const { t } = useI18n()

const isPromoted = computed(() => Boolean(props.listing.promotions?.highlight))

const ratingLabel = computed(() => {
  if (!props.listing.reviewCount || props.listing.averageRating == null) {
    return null
  }

  return `${props.listing.averageRating} (${props.listing.reviewCount})`
})

const showCityPin = computed(() => Boolean(props.listing.promotions?.cityPin))

const showOverlayBadges = computed(() =>
  Boolean(
    props.listing.hostVerified
    || props.listing.teamBadge
    || props.listing.promotions?.boost
    || showCityPin.value,
  ),
)
</script>

<template>
  <NuxtLink
    :to="localePath(`/listings/${listing.id}`)"
    class="group grid w-full grid-cols-[minmax(7rem,9rem)_minmax(0,1fr)_auto] gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:gap-4"
    :class="isPromoted
      ? 'rounded-xl bg-brand-50/40 px-2 py-1 ring-1 ring-brand-300/40 dark:bg-brand-950/25 dark:ring-brand-700/35'
      : ''"
    :data-testid="isPromoted ? 'search-result-highlighted' : undefined"
  >
    <div
      class="relative h-24 overflow-hidden rounded-lg bg-stone-100 sm:h-28 dark:bg-stone-800"
      :class="isPromoted ? 'ring-1 ring-brand-300/60 dark:ring-brand-600/45' : ''"
    >
      <ListingImage
        v-if="listing.coverPhoto"
        :src="listing.coverPhoto.url"
        :alt="listing.title"
        class="size-full transition duration-500 group-hover:scale-105"
      />
      <ListingImagePlaceholder v-else />

      <div
        v-if="showOverlayBadges"
        class="absolute inset-x-1.5 top-1.5 z-20 flex max-w-[calc(100%-0.75rem)] flex-wrap items-center gap-1"
      >
        <ListingPromotionBadges
          :host-verified="listing.hostVerified"
          :boost="listing.promotions?.boost"
          :city-pin="showCityPin"
          overlay
        />
        <ListingTeamBadge
          v-if="listing.teamBadge"
          :badge="listing.teamBadge"
          overlay
        />
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-1.5">
      <h3
        class="line-clamp-2 text-sm font-semibold leading-snug sm:text-base"
        :class="isPromoted
          ? 'text-brand-900 dark:text-brand-100'
          : 'text-stone-900 dark:text-stone-50'"
      >
        {{ listing.title }}
      </h3>
      <p class="line-clamp-2 text-xs text-stone-500 sm:text-sm dark:text-stone-400">
        {{ listing.city }}<template v-if="listing.address">, {{ listing.address }}</template>
      </p>
      <p class="text-xs text-stone-500 dark:text-stone-500">
        {{ listing.maxGuests }} {{ t('listing.guests') }} · {{ listing.bedrooms }} {{ t('listing.bedrooms') }}
        <template v-if="listing.distance !== undefined">
          · {{ listing.distance.toFixed(1) }} km
        </template>
      </p>
      <span
        v-if="ratingLabel"
        class="inline-flex w-fit items-center gap-1 rounded-md bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-white"
      >
        <Icon
          name="ph:star-fill"
          class="size-3.5"
        />
        {{ ratingLabel }}
      </span>
    </div>

    <div class="flex flex-col items-end justify-start text-right">
      <p class="text-lg font-bold leading-none text-stone-900 sm:text-xl dark:text-stone-50">
        {{ formatPrice(listing.pricePerNight) }}
      </p>
      <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">
        {{ t('listing.perNight') }}
      </p>
    </div>
  </NuxtLink>
</template>
