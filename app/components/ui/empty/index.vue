<script setup lang="ts">
import type { UiEmptyProps } from './types'

const props = withDefaults(defineProps<UiEmptyProps>(), {
  icon: 'ph:tray-duotone',
  embedded: false,
  inline: false,
  brand: false,
})

const resolvedIcon = computed(() =>
  props.brand ? 'ph:tree-evergreen-duotone' : props.icon,
)

const rootClass = computed(() => {
  if (props.brand) {
    return 'relative mx-auto max-w-md overflow-hidden rounded-2xl border border-dashed border-brand-200/80 bg-linear-to-b from-brand-50/70 via-white to-stone-50/80 p-10 text-center dark:border-brand-800/50 dark:from-brand-950/30 dark:via-stone-900 dark:to-stone-950'
  }
  if (props.inline) {
    return 'pt-2 text-center'
  }

  if (props.embedded) {
    return 'rounded-xl bg-stone-50/70 py-8 text-center ring-1 ring-stone-200/60 dark:bg-stone-800/30 dark:ring-stone-700/50'
  }

  return 'surface-card mx-auto max-w-md p-10 text-center'
})

const iconWrapClass = computed(() => {
  if (props.brand) {
    return 'relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-900/20 dark:from-brand-500 dark:to-brand-700'
  }

  if (props.inline) {
    return 'mx-auto flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
  }

  if (props.embedded) {
    return 'mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100/80 dark:bg-brand-950/60 dark:ring-brand-900/50'
  }

  return 'mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-100/80 dark:bg-brand-950/60 dark:ring-brand-900/50'
})

const iconClass = computed(() => {
  if (props.brand) {
    return 'size-8 text-white'
  }

  if (props.inline || props.embedded) {
    return 'size-5 text-brand-600 dark:text-brand-400'
  }

  return 'size-8 text-brand-600 dark:text-brand-400'
})

const titleClass = computed(() => {
  if (props.inline) {
    return 'mt-3 text-sm font-medium text-stone-600 dark:text-stone-400'
  }

  if (props.embedded) {
    return 'mt-4 text-base font-semibold tracking-tight text-stone-900 dark:text-stone-50'
  }

  return 'mt-5 text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50'
})
</script>

<template>
  <div :class="rootClass">
    <div
      v-if="brand"
      class="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-brand-300/20 blur-2xl dark:bg-brand-700/15"
      aria-hidden="true"
    />
    <div :class="iconWrapClass">
      <Icon
        :name="resolvedIcon"
        :class="iconClass"
      />
    </div>
    <h2
      :class="titleClass"
    >
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
