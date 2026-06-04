<script setup lang="ts">
import type { UiForestDividerProps } from './types'

const props = withDefaults(defineProps<UiForestDividerProps>(), {
  flip: false,
  tone: 'sand',
})

const toneClass = computed(() => {
  if (props.tone === 'white') {
    return 'text-white dark:text-stone-950'
  }

  if (props.tone === 'forest') {
    return 'text-stone-950'
  }

  return 'text-[#f7f5f2] dark:text-stone-950'
})
</script>

<template>
  <div
    class="pointer-events-none relative z-10 w-full leading-0"
    :class="[toneClass, flip ? 'rotate-180' : '']"
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      class="block h-7 w-full translate-y-px md:h-10"
      shape-rendering="geometricPrecision"
    >
      <path
        fill="currentColor"
        d="M0,28 C240,10 480,38 720,22 C960,6 1200,34 1440,24 L1440,48 L0,48 Z"
      />
    </svg>
  </div>
</template>
