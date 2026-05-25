<script setup lang="ts">
import type { SearchEmptyStateEmits, SearchEmptyStateProps } from './types'

defineProps<SearchEmptyStateProps>()
const emit = defineEmits<SearchEmptyStateEmits>()

const localePath = useLocalePath()
</script>

<template>
  <section
    class="relative flex min-h-[min(22rem,45vh)] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-200/90 bg-linear-to-b from-brand-50/60 via-white to-stone-50/80 px-6 py-14 text-center dark:border-stone-700 dark:from-brand-950/25 dark:via-stone-900 dark:to-stone-950"
    data-testid="search-empty-state"
  >
    <div
      class="pointer-events-none absolute inset-x-8 top-1/4 h-28 rounded-full bg-brand-300/25 blur-3xl dark:bg-brand-700/20"
      aria-hidden="true"
    />

    <div class="relative mb-8">
      <div
        class="absolute -inset-3 rounded-3xl bg-brand-200/40 blur-xl dark:bg-brand-800/25"
        aria-hidden="true"
      />
      <div
        class="relative flex size-18 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-stone-200/90 dark:bg-stone-800 dark:ring-stone-600"
      >
        <Icon
          name="ph:house-line-duotone"
          class="size-10 text-brand-600 dark:text-brand-400"
        />
      </div>
    </div>

    <h2 class="relative max-w-sm text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
      {{ title }}
    </h2>
    <p class="relative mt-2 max-w-md text-sm leading-relaxed text-stone-600 dark:text-stone-400">
      {{ description }}
    </p>

    <div class="relative mt-8 flex flex-wrap items-center justify-center gap-3">
      <UiButton
        v-if="hasActiveFilters"
        type="button"
        size="lg"
        data-testid="search-clear-filters"
        @click="emit('clearFilters')"
      >
        <Icon
          name="ph:funnel-simple-x"
          class="mr-1.5 size-4 shrink-0"
        />
        {{ clearFiltersLabel }}
      </UiButton>

      <NuxtLink :to="localePath('/search')">
        <UiButton
          :variant="hasActiveFilters ? 'outline' : 'primary'"
          size="lg"
          data-testid="search-reset-all"
        >
          {{ resetSearchLabel }}
        </UiButton>
      </NuxtLink>
    </div>

    <ul
      class="relative mt-8 flex flex-wrap justify-center gap-2 text-xs text-stone-500 dark:text-stone-500"
      role="list"
    >
      <li
        class="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-stone-200/80 dark:bg-stone-800/80 dark:ring-stone-700"
        role="listitem"
      >
        <Icon
          name="ph:calendar-blank-duotone"
          class="size-3.5 shrink-0 text-brand-600 dark:text-brand-400"
        />
        {{ tipDates }}
      </li>
      <li
        class="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-stone-200/80 dark:bg-stone-800/80 dark:ring-stone-700"
        role="listitem"
      >
        <Icon
          name="ph:map-pin-duotone"
          class="size-3.5 shrink-0 text-brand-600 dark:text-brand-400"
        />
        {{ tipCity }}
      </li>
    </ul>
  </section>
</template>
