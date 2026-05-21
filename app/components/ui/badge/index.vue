<script setup lang="ts">
import type { UiBadgeProps } from './types'

const props = withDefaults(defineProps<UiBadgeProps>(), {
  variant: 'default',
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'brand':
      return 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
    case 'success':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
    case 'warning':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
    case 'danger':
      return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
    case 'muted':
      return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
    default:
      return 'bg-stone-200/80 text-stone-800 dark:bg-stone-700 dark:text-stone-100'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="variantClass"
  >
    <slot />
  </span>
</template>
