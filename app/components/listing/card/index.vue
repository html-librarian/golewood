<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import type { ListingCardProps } from './types'

const props = defineProps<ListingCardProps>()

const localePath = useLocalePath()
const { t, locale } = useI18n()

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
</script>

<template>
  <NuxtLink
    :to="localePath(`/listings/${listing.id}`)"
    class="group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-white shadow-(--shadow-soft) transition duration-300 hover:-translate-y-0.5 hover:shadow-(--shadow-card-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 active:scale-[0.99] dark:bg-stone-900 dark:focus-visible:ring-offset-stone-950"
    :class="isPromoted
      ? 'border-brand-400/70 bg-brand-50/50 ring-1 ring-brand-300/50 dark:border-brand-600/40 dark:bg-brand-950/35 dark:ring-brand-700/40'
      : 'border-stone-200/80 dark:border-stone-800'"
    :data-testid="isPromoted ? 'listing-card-highlighted' : undefined"
  >
    <div class="relative aspect-4/3 w-full shrink-0 overflow-hidden bg-stone-100 dark:bg-stone-800">
      <ListingImage
        v-if="listing.coverPhoto"
        :src="listing.coverPhoto.url"
        :alt="listing.title"
        class="transition duration-500 group-hover:scale-105"
      />
      <ListingImagePlaceholder v-else />

      <div class="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-stone-900/50 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div
        v-if="showOverlayBadges"
        class="absolute inset-x-2 top-2 z-20 flex max-w-[calc(100%-1rem)] flex-wrap items-center gap-1"
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

      <p class="absolute bottom-3 left-3 z-10 rounded-lg bg-white/95 px-2.5 py-1 text-sm font-semibold text-stone-900 shadow-sm backdrop-blur-sm dark:bg-stone-900/95 dark:text-stone-50">
        <template v-if="listing.kind === 'property' && listing.priceFrom">
          {{ t('listing.priceFrom') }} {{ formatPrice(listing.priceFrom) }}
        </template>
        <template v-else>
          {{ formatPrice(listing.pricePerNight) }}
        </template>
        <span class="font-normal text-stone-500 dark:text-stone-400">{{ t('listing.perNight') }}</span>
      </p>
    </div>

    <div class="space-y-1.5 p-4">
      <h3
        class="line-clamp-2 font-semibold leading-snug"
        :class="isPromoted
          ? 'text-brand-900 dark:text-brand-100'
          : 'text-stone-900 dark:text-stone-50'"
      >
        {{ listing.title }}
      </h3>
      <p class="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400">
        <Icon
          name="ph:map-pin-duotone"
          class="size-4 shrink-0"
        />
        {{ listing.city }}
      </p>
      <p
        v-if="listing.reviewCount"
        class="flex items-center gap-1 text-sm font-medium text-stone-700 dark:text-stone-300"
      >
        <Icon
          name="ph:star-fill"
          class="size-4 text-accent-500"
        />
        {{ listing.averageRating }}
        <span class="font-normal text-stone-500 dark:text-stone-400">
          · {{ listing.reviewCount }} {{ t('listing.reviews') }}
        </span>
      </p>
      <p class="text-xs text-stone-500 dark:text-stone-500">
        {{ listing.maxGuests }} {{ t('listing.guests') }} · {{ listing.bedrooms }} {{ t('listing.bedrooms') }}
      </p>
      <p
        v-if="teamReviewExcerpt"
        class="line-clamp-2 text-xs leading-relaxed text-brand-800/90 dark:text-brand-200/90"
      >
        {{ teamReviewExcerpt }}
      </p>
    </div>
  </NuxtLink>
</template>
