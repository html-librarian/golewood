<script setup lang="ts">
import type { UiEmptyProps } from './types'

withDefaults(defineProps<UiEmptyProps>(), {
  icon: 'ph:tray-duotone',
})
</script>

<template>
  <div class="surface-card mx-auto max-w-md p-10 text-center">
    <div class="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/60">
      <Icon
        :name="icon"
        class="size-8 text-brand-600 dark:text-brand-400"
      />
    </div>
    <h2 class="mt-5 font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
      {{ title }}
    </h2>
    <p
      v-if="description"
      class="mt-2 text-sm text-stone-600 dark:text-stone-400"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.default"
      class="mt-6"
    >
      <slot />
    </div>
  </div>
</template>
