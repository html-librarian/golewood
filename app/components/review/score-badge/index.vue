<script setup lang="ts">
import { formatReviewScore, getReviewRatingLabel, getReviewScoreTone } from '#shared/utils/review-rating'
import type { ReviewScoreBadgeProps } from './types'

const props = withDefaults(defineProps<ReviewScoreBadgeProps>(), {
  showLabel: true,
  size: 'md',
})

const { locale } = useI18n()

const formattedScore = computed(() => formatReviewScore(props.score, locale.value))
const label = computed(() => getReviewRatingLabel(props.score, locale.value))
const tone = computed(() => getReviewScoreTone(props.score))

const badgeClass = computed(() => {
  if (tone.value === 'exceptional') {
    return 'bg-linear-to-br from-brand-600 to-brand-800 shadow-sm dark:from-brand-500 dark:to-brand-700'
  }

  if (tone.value === 'great') {
    return 'bg-brand-600 shadow-sm dark:bg-brand-500'
  }

  if (tone.value === 'good') {
    return 'bg-brand-500/95 dark:bg-brand-500/90'
  }

  return 'bg-amber-600 dark:bg-amber-500'
})
</script>

<template>
  <div
    class="inline-flex items-center"
    :class="size === 'sm' ? 'gap-2' : 'gap-2.5'"
  >
    <span
      class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      :class="[
        badgeClass,
        size === 'sm' ? 'min-w-11 px-2.5 py-1 text-sm' : 'min-w-14 px-3 py-1.5 text-base',
      ]"
    >
      {{ formattedScore }}
    </span>
    <span
      v-if="showLabel"
      class="font-medium text-stone-800 dark:text-stone-100"
      :class="size === 'sm' ? 'text-sm' : 'text-base'"
    >
      {{ label }}
    </span>
  </div>
</template>
