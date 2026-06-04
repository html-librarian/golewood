<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import {
  formatListingPriceBreakdown,
  listingPriceInputFromStored,
  resolveListingPricePerNight,
  type ListingPriceInputMode,
} from '#shared/utils/listing-price-preview'
import type { HostListingPriceInputEmits, HostListingPriceInputProps } from './types'

const props = defineProps<HostListingPriceInputProps>()
const emit = defineEmits<HostListingPriceInputEmits>()

const pricePerNight = defineModel<string>({ required: true })
const mode = defineModel<ListingPriceInputMode>('mode', { default: 'hostNet' })

const inputValue = ref('')

const syncInputFromStored = () => {
  const stored = Number(pricePerNight.value) || 0
  inputValue.value = stored > 0
    ? String(listingPriceInputFromStored(mode.value, stored))
    : pricePerNight.value
}

syncInputFromStored()

watch(mode, () => {
  syncInputFromStored()
  emit('update:mode', mode.value)
})

watch(pricePerNight, (stored) => {
  const resolved = String(resolveListingPricePerNight(mode.value, Number(inputValue.value) || 0))

  if (stored !== resolved) {
    syncInputFromStored()
  }
})

watch(inputValue, (value) => {
  const parsed = Number(value) || 0
  pricePerNight.value = String(resolveListingPricePerNight(mode.value, parsed))
})

const breakdown = computed(() =>
  formatListingPriceBreakdown(Number(pricePerNight.value) || 0),
)

const showBreakdown = computed(() => breakdown.value.pricePerNight > 0)

const activeLabel = computed(() =>
  mode.value === 'hostNet' ? props.labelHostNet : props.labelGuestTotal,
)

const feeHint = computed(() =>
  mode.value === 'hostNet' ? props.feeHintHostNet : props.feeHintGuestTotal,
)
</script>

<template>
  <div
    class="space-y-3"
    data-testid="host-listing-price-input"
  >
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="chip"
        :class="mode === 'hostNet' ? 'chip-active' : 'chip-inactive'"
        @click="mode = 'hostNet'"
      >
        {{ modeHostNet }}
      </button>
      <button
        type="button"
        class="chip"
        :class="mode === 'guestTotal' ? 'chip-active' : 'chip-inactive'"
        @click="mode = 'guestTotal'"
      >
        {{ modeGuestTotal }}
      </button>
    </div>

    <FormInput
      v-model="inputValue"
      type="number"
      min="1"
      :label="activeLabel"
      required
    />

    <div
      v-if="showBreakdown"
      class="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm dark:border-stone-700 dark:bg-stone-800/40"
      data-testid="host-listing-price-breakdown"
    >
      <p class="font-medium text-stone-800 dark:text-stone-100">
        {{ guestPaysLabel }}: {{ formatPrice(breakdown.guestTotal) }}
      </p>
      <p class="mt-1 text-stone-600 dark:text-stone-400">
        {{ hostReceivesLabel }}: {{ formatPrice(breakdown.pricePerNight) }}
      </p>
      <p class="mt-2 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
        {{ feeHint.replace('{fee}', formatPrice(breakdown.serviceFee)).replace('{total}', formatPrice(breakdown.guestTotal)) }}
      </p>
    </div>
  </div>
</template>
