<script setup lang="ts">
import type { UiIconTooltipProps } from './types'

const { label, placement = 'bottom' } = defineProps<UiIconTooltipProps>()

const placementClass = placement === 'top'
  ? 'bottom-full mb-1.5'
  : 'top-full mt-1.5'
</script>

<template>
  <span class="group/icon-tip relative inline-flex">
    <slot />
    <span
      role="tooltip"
      :class="[
        'pointer-events-none absolute left-1/2 z-60 -translate-x-1/2 whitespace-nowrap rounded-md border border-stone-700/80 bg-stone-900 px-2 py-1 text-xs font-medium text-stone-50 opacity-0 shadow-md transition-opacity duration-150 group-hover/icon-tip:opacity-100 group-focus-within/icon-tip:opacity-100 dark:border-stone-300/80 dark:bg-stone-100 dark:text-stone-900',
        placementClass,
      ]"
    >
      {{ label }}
    </span>
  </span>
</template>
