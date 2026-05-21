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
    ? 'inline-flex max-w-full items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-xs font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-200/80 backdrop-blur-sm dark:bg-stone-900/95 dark:text-emerald-300 dark:ring-emerald-800/50'
    : 'inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-emerald-400 dark:text-emerald-950',
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
        class="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
      />
      {{ t('hostVerification.verifiedShort') }}
    </span>
  </div>
</template>
