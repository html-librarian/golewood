<script setup lang="ts">
import type { ListingCard } from '#shared/types/listing'
import type { HostListingPreviewProps } from './types'

const props = defineProps<HostListingPreviewProps>()

const displayTitle = computed(() =>
  props.title.trim() || props.placeholderTitle,
)

const displayCity = computed(() =>
  props.city.trim() || props.placeholderCity,
)

const previewListing = computed((): ListingCard => ({
  id: 'preview',
  hostId: 'preview',
  kind: 'standalone',
  propertyListingId: null,
  title: displayTitle.value,
  description: '',
  status: 'draft',
  pricePerNight: props.guestPricePerNight ?? 0,
  city: displayCity.value,
  address: '',
  latitude: 0,
  longitude: 0,
  maxGuests: Math.max(1, props.maxGuests || 1),
  extraGuestsOffered: false,
  maxGuestsWithExtra: null,
  extraGuestPricePerNight: null,
  bedrooms: Math.max(1, props.bedrooms || 1),
  amenities: [],
  houseRules: '',
  checkInTime: '15:00',
  checkOutTime: '12:00',
  minNights: 1,
  cancellationPolicy: 'moderate',
  cleaningFee: 0,
  transferOffered: false,
  transferPrice: null,
  transferPriceOnRequest: false,
  contacts: {},
  managedByTeam: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  coverPhoto: props.coverPhotoUrl
    ? {
        id: 'preview-photo',
        url: props.coverPhotoUrl,
        sortOrder: 0,
        mediaType: 'photo',
      }
    : null,
}))
</script>

<template>
  <div
    class="space-y-3"
    data-testid="host-listing-preview"
  >
    <p class="text-sm font-medium text-stone-700 dark:text-stone-300">
      {{ caption }}
    </p>

    <ListingCard
      preview
      :listing="previewListing"
      :display-price-per-night="guestPricePerNight ?? undefined"
    />

    <p class="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
      {{ hint }}
    </p>
  </div>
</template>
