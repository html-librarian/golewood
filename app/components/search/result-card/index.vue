<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import type { SearchResultCardProps } from './types'

const props = defineProps<SearchResultCardProps>()

const localePath = useLocalePath()
const { t } = useI18n()

const isPromoted = computed(() => Boolean(props.listing.promotions?.highlight))

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
    class="group grid w-full grid-cols-[minmax(7rem,9rem)_minmax(0,1fr)_auto] gap-3 rounded-xl px-1 py-2 transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-2 dark:hover:bg-stone-900/60"
    :class="isPromoted
      ? 'bg-brand-50/50 ring-1 ring-brand-300/35 dark:bg-brand-950/20 dark:ring-brand-700/35'
      : ''"
    :data-testid="isPromoted ? 'search-result-highlighted' : undefined"
  >
    <div
      class="search-result-thumb relative h-24 overflow-hidden rounded-xl bg-stone-100 shadow-sm sm:h-28 dark:bg-stone-800"
      :class="isPromoted ? 'ring-1 ring-brand-300/60 dark:ring-brand-600/45' : 'ring-1 ring-stone-200/60 dark:ring-stone-700/60'"
    >
      <ListingImage
        v-if="listing.coverPhoto"
        :src="listing.coverPhoto.url"
        :alt="listing.title"
        class="size-full transition duration-700 ease-out group-hover:scale-[1.04]"
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

    <div class="flex min-w-0 flex-col gap-1.5 py-0.5">
      <p
        class="line-clamp-2 font-display text-sm font-semibold leading-snug sm:text-base"
        :class="isPromoted
          ? 'text-brand-900 dark:text-brand-100'
          : 'text-stone-900 dark:text-stone-50'"
      >
        {{ listing.title }}
      </p>
      <p class="line-clamp-2 text-xs text-stone-500 sm:text-sm dark:text-stone-400">
        {{ listing.city }}<template v-if="listing.address">, {{ listing.address }}</template>
      </p>
      <p class="text-xs text-stone-500 dark:text-stone-500">
        {{ listing.maxGuests }} {{ t('listing.guests') }} · {{ listing.bedrooms }} {{ t('listing.bedrooms') }}
        <template v-if="listing.distance !== undefined">
          · {{ listing.distance.toFixed(1) }} km
        </template>
      </p>
      <UiRatingPill
        v-if="listing.reviewCount && listing.averageRating != null"
        :score="listing.averageRating"
        :count="listing.reviewCount"
        size="sm"
        class="w-fit"
      />
    </div>

    <div class="flex flex-col items-end justify-start py-0.5 text-right">
      <p class="text-lg font-bold leading-none text-stone-900 sm:text-xl dark:text-stone-50">
        {{ formatPrice(listing.pricePerNight) }}
      </p>
      <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">
        {{ t('listing.perNight') }}
      </p>
    </div>
  </NuxtLink>
</template>
