<script setup lang="ts">
import { REVIEW_RATING_DIMENSIONS } from '#shared/types/review-ratings'
import { formatReviewScore, getReviewRatingLabel } from '#shared/utils/review-rating'
import type { ReviewRatingSummaryProps } from './types'

const props = defineProps<ReviewRatingSummaryProps>()

const { locale } = useI18n()

const formattedOverall = computed(() => formatReviewScore(props.breakdown.overall, locale.value))
const overallLabel = computed(() => getReviewRatingLabel(props.breakdown.overall, locale.value))

const leftDimensions = REVIEW_RATING_DIMENSIONS.slice(0, 3)
const rightDimensions = REVIEW_RATING_DIMENSIONS.slice(3)
</script>

<template>
  <section
    data-testid="review-rating-summary"
    class="overflow-hidden rounded-2xl border border-stone-200/80 bg-linear-to-br from-brand-50/90 via-white to-stone-50/80 p-5 shadow-(--shadow-soft) sm:p-6 dark:border-stone-800 dark:from-brand-950/50 dark:via-stone-900 dark:to-stone-950/80"
  >
    <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
      <div class="flex shrink-0 flex-col items-center gap-3 text-center lg:min-w-44 lg:items-start lg:text-left">
        <div
          class="relative flex size-28 items-center justify-center rounded-full bg-linear-to-br from-brand-600 to-brand-800 shadow-[0_12px_32px_-8px_rgba(13,148,136,0.45)] ring-4 ring-white/80 dark:from-brand-500 dark:to-brand-700 dark:ring-stone-800/80"
          :aria-label="$t('review.overallScore', { score: formattedOverall })"
        >
          <span class="font-display text-4xl font-bold tracking-tight text-white">
            {{ formattedOverall }}
          </span>
          <Icon
            name="ph:star-fill"
            class="absolute -right-0.5 -top-0.5 size-6 text-accent-400"
            aria-hidden="true"
          />
        </div>

        <div class="space-y-1">
          <p class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
            {{ overallLabel }}
          </p>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{ $t('review.totalCount', { count: totalCount }) }}
          </p>
        </div>
      </div>

      <div class="grid flex-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <div class="space-y-4">
          <ReviewRatingBar
            v-for="dimension in leftDimensions"
            :key="dimension"
            :dimension="dimension"
            :score="breakdown[dimension]"
          />
        </div>
        <div class="space-y-4">
          <ReviewRatingBar
            v-for="dimension in rightDimensions"
            :key="dimension"
            :dimension="dimension"
            :score="breakdown[dimension]"
          />
        </div>
      </div>
    </div>
  </section>
</template>
