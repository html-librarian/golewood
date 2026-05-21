<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import type { ListingMapPopupCardProps } from './types'

const props = defineProps<ListingMapPopupCardProps>()

const localePath = useLocalePath()
const { t } = useI18n()

const listingUrl = computed(() => localePath(`/listings/${props.listing.id}`))

const openListing = () => {
  void navigateTo(listingUrl.value)
}
</script>

<template>
  <button
    type="button"
    class="block w-56 cursor-pointer overflow-hidden rounded-xl border border-stone-200/90 bg-white text-left shadow-xl ring-1 ring-black/5 transition hover:border-brand-300 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-stone-600 dark:bg-stone-900 dark:ring-white/10 dark:hover:border-brand-600"
    data-testid="map-popup-listing"
    @click.stop="openListing()"
  >
    <div class="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-stone-200 dark:bg-stone-800">
      <ListingImage
        v-if="listing.coverPhoto"
        :src="listing.coverPhoto.url"
        :alt="listing.title"
        class="size-full"
        eager
      />
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center bg-linear-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900"
      >
        <Icon
          name="ph:house-line-duotone"
          class="size-9 text-stone-400 dark:text-stone-500"
        />
      </div>
    </div>

    <div class="space-y-1 px-3 py-2.5">
      <p class="line-clamp-2 text-sm font-semibold leading-snug text-stone-900 dark:text-stone-50">
        {{ listing.title }}
      </p>
      <p class="text-xs text-stone-600 dark:text-stone-400">
        <span class="font-semibold tabular-nums text-stone-900 dark:text-stone-100">{{ formatPrice(listing.pricePerNight) }}</span>
        <span class="text-stone-400 dark:text-stone-500"> · </span>
        {{ listing.city }}
      </p>
      <p class="text-xs font-medium text-brand-700 dark:text-brand-300">
        {{ t('listing.openListing') }} →
      </p>
    </div>
  </button>
</template>
