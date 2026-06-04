<script setup lang="ts">
import type { UiRevealProps } from './types'

withDefaults(defineProps<UiRevealProps>(), {
  delay: 0,
})

const root = ref<HTMLElement | null>(null)

useRevealOnScroll(root)
</script>

<template>
  <div
    ref="root"
    class="reveal-section"
    :style="delay > 0 ? { transitionDelay: `${delay}ms` } : undefined"
  >
    <slot />
  </div>
</template>
