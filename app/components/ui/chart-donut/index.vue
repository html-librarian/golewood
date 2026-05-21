<script setup lang="ts">
import type { UiChartDonutProps } from './types'

const props = defineProps<UiChartDonutProps>()

const total = computed(() =>
  props.segments.reduce((sum, segment) => sum + segment.value, 0),
)

const visibleSegments = computed(() =>
  props.segments.filter(segment => segment.value > 0),
)

const radius = 44
const circumference = 2 * Math.PI * radius

const arcs = computed(() => {
  let offset = 0

  return visibleSegments.value.map((segment) => {
    const fraction = segment.value / total.value
    const length = circumference * fraction
    const dasharray = `${length} ${circumference - length}`
    const dashoffset = -offset
    offset += length

    return { ...segment, dasharray, dashoffset }
  })
})
</script>

<template>
  <section
    v-if="total > 0"
    class="surface-card p-5"
  >
    <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
      <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
        {{ title }}
      </h2>
      <p
        v-if="totalLabel"
        class="text-sm text-stone-500 dark:text-stone-400"
      >
        {{ totalLabel }}: {{ total }}
      </p>
    </div>

    <div class="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div class="relative size-28 shrink-0">
        <svg
          viewBox="0 0 100 100"
          class="size-full -rotate-90"
          role="img"
          :aria-label="title"
        >
          <circle
            cx="50"
            cy="50"
            :r="radius"
            fill="none"
            class="stroke-stone-100 dark:stroke-stone-800"
            stroke-width="12"
          />
          <circle
            v-for="arc in arcs"
            :key="arc.label"
            cx="50"
            cy="50"
            :r="radius"
            fill="none"
            stroke-width="12"
            stroke-linecap="round"
            :stroke-dasharray="arc.dasharray"
            :stroke-dashoffset="arc.dashoffset"
            class="transition-all duration-500"
            :class="arc.color"
          />
        </svg>
        <p class="absolute inset-0 flex items-center justify-center font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
          {{ total }}
        </p>
      </div>

      <ul class="flex w-full flex-wrap gap-x-4 gap-y-2 sm:flex-1">
        <li
          v-for="segment in visibleSegments"
          :key="segment.label"
          class="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400"
        >
          <span
            class="size-2.5 shrink-0 rounded-full"
            :class="segment.color.replace(/^stroke-/, 'bg-')"
          />
          <span>{{ segment.label }}</span>
          <span class="font-semibold text-stone-900 dark:text-stone-100">{{ segment.value }}</span>
        </li>
      </ul>
    </div>
  </section>

  <section
    v-else-if="emptyLabel"
    class="surface-card p-5"
  >
    <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
      {{ title }}
    </h2>
    <p class="mt-3 text-sm text-stone-500 dark:text-stone-400">
      {{ emptyLabel }}
    </p>
  </section>
</template>
