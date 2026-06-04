<script setup lang="ts">
import { formatReviewScore } from '#shared/utils/review-rating'
import type { UiAnimatedScoreProps } from './types'

const props = withDefaults(defineProps<UiAnimatedScoreProps>(), {
  locale: 'ru',
})

const scoreRef = computed(() => props.score)
const { display } = useCountUp(scoreRef, { duration: 800, decimals: 1 })

const formatted = computed(() => {
  if (display.value === null) {
    return '—'
  }

  return formatReviewScore(display.value, props.locale)
})
</script>

<template>
  <span
    class="inline-flex items-center gap-2"
    data-testid="ui-animated-score"
  >
    <span
      class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-600 to-brand-800 text-white shadow-md shadow-brand-900/25 dark:from-brand-500 dark:to-brand-700"
      aria-hidden="true"
    >
      <Icon
        name="ph:star-fill"
        class="size-6 text-accent-300"
      />
    </span>
    <span class="font-display text-4xl font-semibold tabular-nums tracking-tight text-stone-900 dark:text-stone-50">
      {{ formatted }}
    </span>
  </span>
</template>
