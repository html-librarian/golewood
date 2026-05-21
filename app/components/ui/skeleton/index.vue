<script setup lang="ts">
import type { UiSkeletonProps } from './types'

const props = withDefaults(defineProps<UiSkeletonProps>(), {
  variant: 'text',
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'title':
      return 'h-7 w-3/5 rounded-lg'
    case 'card':
      return 'aspect-4/3 w-full rounded-2xl'
    case 'avatar':
      return 'size-10 rounded-full'
    case 'button':
      return 'h-10 w-28 rounded-xl'
    default:
      return 'h-4 w-full rounded-md'
  }
})
</script>

<template>
  <div
    class="skeleton-shimmer bg-stone-200 dark:bg-stone-800"
    :class="[variantClass, props.class]"
    aria-hidden="true"
  />
</template>
