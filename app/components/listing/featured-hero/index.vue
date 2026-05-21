<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import type { ListingFeaturedHeroProps } from './types'

const props = defineProps<ListingFeaturedHeroProps>()

const localePath = useLocalePath()
const { t } = useI18n()

const isHighlighted = computed(() => Boolean(props.listing.promotions?.highlight))
</script>

<template>
  <NuxtLink
    :to="localePath(`/listings/${listing.id}`)"
    class="group grid overflow-hidden rounded-2xl border shadow-(--shadow-card-hover) transition duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 dark:focus-visible:ring-offset-stone-950 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
    :class="isHighlighted
      ? 'border-brand-400/70 bg-brand-50/40 ring-1 ring-brand-300/50 dark:border-brand-600/40 dark:bg-brand-950/30 dark:ring-brand-700/40'
      : 'border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-900'"
    data-testid="listing-featured-hero"
  >
    <div class="relative aspect-16/10 min-h-48 overflow-hidden bg-stone-100 md:aspect-auto md:min-h-72 dark:bg-stone-800">
      <ListingImage
        v-if="listing.coverPhoto"
        :src="listing.coverPhoto.url"
        :alt="listing.title"
        class="size-full transition duration-500 group-hover:scale-105"
      />
      <ListingImagePlaceholder v-else />

      <div class="absolute inset-x-3 top-3 z-20 flex flex-wrap items-center gap-1.5">
        <span
          class="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm dark:bg-brand-500 dark:text-brand-950"
          data-testid="listing-featured-hero-pin"
        >
          <Icon
            name="ph:map-pin-fill"
            class="size-3.5"
          />
          {{ t('promotion.cityPinBadge') }}
        </span>
        <ListingPromotionBadges
          :host-verified="listing.hostVerified"
          :boost="listing.promotions?.boost"
          overlay
        />
        <ListingTeamBadge
          v-if="listing.teamBadge"
          :badge="listing.teamBadge"
          overlay
        />
      </div>
    </div>

    <div class="flex flex-col justify-center gap-3 p-5 md:p-8">
      <p class="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
        {{ t('promotion.cityPinHeroLabel') }}
      </p>
      <h3
        class="font-display text-2xl font-semibold leading-tight text-stone-900 md:text-3xl dark:text-stone-50"
        :class="isHighlighted ? 'text-brand-900 dark:text-brand-100' : ''"
      >
        {{ listing.title }}
      </h3>
      <p class="text-sm text-stone-600 md:text-base dark:text-stone-400">
        {{ listing.city }}<template v-if="listing.address"> · {{ listing.address }}</template>
      </p>
      <p class="text-sm text-stone-500 dark:text-stone-500">
        {{ listing.maxGuests }} {{ t('listing.guests') }} · {{ listing.bedrooms }} {{ t('listing.bedrooms') }}
      </p>
      <p class="text-xl font-bold text-stone-900 dark:text-stone-50">
        {{ formatPrice(listing.pricePerNight) }}
        <span class="text-sm font-normal text-stone-500 dark:text-stone-400">{{ t('listing.perNight') }}</span>
      </p>
    </div>
  </NuxtLink>
</template>
