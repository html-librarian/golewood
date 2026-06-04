<script setup lang="ts">
import { formatListingTimeLabel } from '#shared/constants/listing-times'
import type { ListingCheckInOutProps } from './types'

defineProps<ListingCheckInOutProps>()
</script>

<template>
  <UiSection
    id="listing-check-in-out"
    :title="labels.title"
    icon="ph:clock-duotone"
    data-testid="listing-check-in-out"
  >
    <div
      class="check-in-out-strip flex items-center justify-center gap-6"
    >
      <div class="text-center">
        <p class="text-3xl font-bold tracking-tight text-brand-800 dark:text-brand-300">
          {{ formatListingTimeLabel(checkInTime) }}
        </p>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {{ labels.checkIn }}
        </p>
      </div>

      <Icon
        name="ph:arrow-right-duotone"
        class="size-6 shrink-0 text-stone-300 dark:text-stone-600"
        aria-hidden="true"
      />

      <div class="text-center">
        <p class="text-3xl font-bold tracking-tight text-brand-800 dark:text-brand-300">
          {{ formatListingTimeLabel(checkOutTime) }}
        </p>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {{ labels.checkOut }}
        </p>
      </div>
    </div>
  </UiSection>
</template>
