<script setup lang="ts">
import type { ReviewRatingDimension } from '#shared/types/review-ratings'
import { formatReviewScore, getReviewScoreTone, reviewRatingBarPercent } from '#shared/utils/review-rating'
import type { ReviewRatingBarProps } from './types'

const props = defineProps<ReviewRatingBarProps>()
const { locale, t } = useI18n()

const DIMENSION_ICONS: Record<ReviewRatingDimension, string> = {
  cleanliness: 'ph:sparkle-duotone',
  checkIn: 'ph:key-duotone',
  location: 'ph:map-pin-duotone',
  photoMatch: 'ph:camera-duotone',
  value: 'ph:coins-duotone',
  service: 'ph:hand-heart-duotone',
}

const formattedScore = computed(() => formatReviewScore(props.score, locale.value))
const barWidth = computed(() => `${reviewRatingBarPercent(props.score)}%`)

const tone = computed(() => getReviewScoreTone(props.score))

const barFillClass = computed(() => {
  if (tone.value === 'exceptional' || tone.value === 'great') {
    return 'bg-linear-to-r from-brand-500 to-brand-600 dark:from-brand-400 dark:to-brand-500'
  }

  if (tone.value === 'good') {
    return 'bg-linear-to-r from-brand-400/90 to-brand-500/90'
  }

  return 'bg-linear-to-r from-amber-500 to-amber-600'
})

const scoreClass = computed(() => {
  if (tone.value === 'exceptional' || tone.value === 'great') {
    return 'text-brand-700 dark:text-brand-300'
  }

  if (tone.value === 'good') {
    return 'text-brand-600 dark:text-brand-400'
  }

  return 'text-amber-700 dark:text-amber-400'
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-2">
      <span class="inline-flex min-w-0 items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
        <Icon
          :name="DIMENSION_ICONS[dimension]"
          class="size-4 shrink-0 text-brand-600/80 dark:text-brand-400/90"
          aria-hidden="true"
        />
        <span class="truncate">{{ t(`review.dimensions.${dimension}`) }}</span>
      </span>
      <span
        class="shrink-0 text-sm font-semibold tabular-nums"
        :class="scoreClass"
      >
        {{ formattedScore }}
      </span>
    </div>
    <div class="h-2 overflow-hidden rounded-full bg-stone-200/90 dark:bg-stone-700/80">
      <div
        class="h-full rounded-full transition-[width] duration-500 ease-out"
        :class="barFillClass"
        :style="{ width: barWidth }"
      />
    </div>
  </div>
</template>
