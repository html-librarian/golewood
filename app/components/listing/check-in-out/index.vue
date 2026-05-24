<script setup lang="ts">
import { formatListingTimeLabel } from '#shared/constants/listing-times'
import type { ListingCheckInOutProps } from './types'

defineProps<ListingCheckInOutProps>()
</script>

<template>
  <section
    id="listing-check-in-out"
    class="scroll-mt-32 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
    data-testid="listing-check-in-out"
  >
    <h2 class="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-50">
      <Icon
        name="ph:clock-duotone"
        class="size-5 shrink-0 text-brand-600 dark:text-brand-400"
      />
      {{ labels.title }}
    </h2>

    <div
      class="mt-3 flex items-center justify-center gap-6 rounded-xl bg-stone-50 px-4 py-4 dark:bg-stone-800/60"
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
  </section>
</template>
