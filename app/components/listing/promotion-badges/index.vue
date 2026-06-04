<script setup lang="ts">
import type { ListingPromotionBadgesProps } from './types'

const props = withDefaults(defineProps<ListingPromotionBadgesProps>(), {
  overlay: false,
})

const { t } = useI18n()

const containerClass = computed(() =>
  props.overlay
    ? 'flex max-w-full flex-wrap items-center gap-1'
    : 'flex flex-wrap items-center gap-1.5',
)

const verifiedClass = computed(() =>
  props.overlay
    ? 'inline-flex max-w-full items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-emerald-950 shadow-sm ring-1 ring-emerald-300/80 dark:bg-emerald-950 dark:text-emerald-50 dark:ring-emerald-700/60'
    : 'inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-800 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-emerald-900 dark:text-white',
)

const verifiedIconClass = computed(() =>
  props.overlay
    ? 'size-3.5 shrink-0 text-emerald-900 dark:text-emerald-200'
    : 'size-3.5 shrink-0 text-current',
)

const pinClass = computed(() =>
  props.overlay
    ? 'inline-flex max-w-full items-center gap-1 rounded-md bg-brand-600/95 px-2 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm dark:bg-brand-500/95 dark:text-brand-950'
    : 'inline-flex max-w-full items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-brand-500 dark:text-brand-950',
)

const boostClass = computed(() =>
  props.overlay
    ? 'inline-flex max-w-full items-center gap-1 rounded-md bg-amber-500/95 px-2 py-0.5 text-xs font-semibold text-amber-950 shadow-sm backdrop-blur-sm'
    : 'inline-flex max-w-full items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-amber-950',
)
</script>

<template>
  <div
    v-if="props.hostVerified || props.boost || props.cityPin"
    :class="containerClass"
  >
    <span
      v-if="props.cityPin"
      :class="pinClass"
      data-testid="listing-promotion-city-pin"
    >
      <Icon
        name="ph:map-pin-fill"
        class="size-3.5 shrink-0"
      />
      {{ t('promotion.cityPinBadge') }}
    </span>
    <span
      v-if="props.boost"
      :class="boostClass"
      data-testid="listing-promotion-boost"
    >
      <Icon
        name="ph:trend-up-duotone"
        class="size-3.5 shrink-0"
      />
      {{ t('promotion.recommended') }}
    </span>
    <span
      v-if="props.hostVerified"
      :class="verifiedClass"
      data-testid="listing-host-verified"
    >
      <Icon
        name="ph:seal-check-duotone"
        :class="verifiedIconClass"
      />
      {{ t('hostVerification.verifiedShort') }}
    </span>
  </div>
</template>
