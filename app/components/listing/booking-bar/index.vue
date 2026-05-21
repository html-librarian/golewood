<script setup lang="ts">
import { countNights } from '#shared/utils/dates'
import { formatPrice } from '#shared/utils/format'
import { calculateBookingPrice } from '#shared/utils/pricing'
import type { ListingBookingBarEmits, ListingBookingBarProps } from './types'

const props = withDefaults(defineProps<ListingBookingBarProps>(), {
  cleaningFee: 0,
  loading: false,
  transferOffered: false,
  transferPrice: null,
  transferPriceOnRequest: false,
  includeTransfer: false,
})
const emit = defineEmits<ListingBookingBarEmits>()

const nights = computed(() =>
  props.checkIn && props.checkOut ? countNights(props.checkIn, props.checkOut) : 0,
)

const total = computed(() => {
  if (!nights.value) {
    return null
  }

  const transferCharge = props.transferOffered && props.includeTransfer && !props.transferPriceOnRequest
    ? (props.transferPrice ?? 0)
    : 0

  return calculateBookingPrice(nights.value, props.pricePerNight, { transferPrice: transferCharge }).total
})
</script>

<template>
  <div
    class="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden dark:border-stone-800 dark:bg-stone-950/95"
  >
    <div class="flex items-center justify-between gap-4">
      <button
        type="button"
        class="min-w-0 text-left"
        @click="emit('scroll-to-panel')"
      >
        <p class="text-lg font-semibold tabular-nums text-stone-900 dark:text-stone-50">
          {{ total !== null ? formatPrice(total) : formatPrice(pricePerNight) }}
        </p>
        <p class="truncate text-xs text-stone-500 dark:text-stone-400">
          {{ total !== null ? $t('booking.total') : $t('listing.perNight') }}
        </p>
      </button>

      <UiButton
        :disabled="!checkIn || !checkOut || nights < 1"
        :loading="loading"
        @click="emit('book')"
      >
        {{ $t('booking.book') }}
      </UiButton>
    </div>
  </div>
</template>
