<script setup lang="ts">
import { formatReviewScore } from '#shared/utils/review-rating'
import type { ListingOverviewStripEmits, ListingOverviewStripProps } from './types'
import ru from './i18n/ru'
import en from './i18n/en'

const props = defineProps<ListingOverviewStripProps>()
const emit = defineEmits<ListingOverviewStripEmits>()

const { t, locale } = usePageI18n({ ru, en })

const formattedScore = computed(() =>
  props.reviewScore !== null ? formatReviewScore(props.reviewScore, locale.value) : null,
)

const locationLine = computed(() => {
  const parts = [props.city, props.address].filter(Boolean)

  return parts.join(', ')
})
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <article class="flex flex-col rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <h2 class="text-sm font-semibold text-stone-900 dark:text-stone-50">
        {{ t('reviewsTitle') }}
      </h2>

      <div
        v-if="formattedScore && reviewCount > 0"
        class="mt-3 flex flex-1 flex-col"
      >
        <div class="flex items-center gap-3">
          <span
            class="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-700 font-display text-2xl font-bold text-white dark:bg-brand-600"
          >
            {{ formattedScore }}
          </span>
          <div class="min-w-0">
            <p
              v-if="reviewLabel"
              class="font-medium text-stone-900 dark:text-stone-50"
            >
              {{ reviewLabel }}
            </p>
            <p class="text-sm text-stone-500 dark:text-stone-400">
              {{ $t('review.totalCount', { count: reviewCount }) }}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="mt-4 text-left text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
          @click="emit('scrollToReviews')"
        >
          {{ t('allReviews') }}
        </button>
      </div>

      <p
        v-else
        class="mt-3 flex-1 text-sm text-stone-500 dark:text-stone-400"
      >
        {{ t('noReviews') }}
      </p>
    </article>

    <article class="flex flex-col rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <h2 class="text-sm font-semibold text-stone-900 dark:text-stone-50">
        {{ t('amenitiesTitle') }}
      </h2>

      <ul
        v-if="amenities.length"
        class="mt-3 flex-1 space-y-2.5"
      >
        <li
          v-for="item in amenities"
          :key="item.slug"
          class="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300"
        >
          <Icon
            :name="item.icon"
            class="size-4 shrink-0 text-brand-600 dark:text-brand-400"
          />
          <span class="min-w-0 truncate">{{ item.label }}</span>
        </li>
      </ul>

      <button
        v-if="amenities.length"
        type="button"
        class="mt-4 text-left text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
        @click="emit('scrollToAmenities')"
      >
        {{ t('allAmenities') }}
      </button>
    </article>

    <article class="flex flex-col rounded-2xl border border-stone-200 bg-white p-4 sm:col-span-2 lg:col-span-1 dark:border-stone-800 dark:bg-stone-900">
      <h2 class="text-sm font-semibold text-stone-900 dark:text-stone-50">
        {{ t('locationTitle') }}
      </h2>

      <p class="mt-3 flex-1 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        {{ locationLine }}
      </p>

      <button
        v-if="hasMap"
        type="button"
        class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
        @click="emit('scrollToMap')"
      >
        <Icon
          name="ph:map-pin-duotone"
          class="size-4"
        />
        {{ t('openMap') }}
      </button>
    </article>
  </div>
</template>
