<script setup lang="ts">
import type { ListingOverviewStripEmits, ListingOverviewStripProps } from './types'
import ru from './i18n/ru'
import en from './i18n/en'

const props = defineProps<ListingOverviewStripProps>()
const emit = defineEmits<ListingOverviewStripEmits>()

const { t, locale } = usePageI18n({ ru, en })
const { t: $t } = useI18n()

const locationLine = computed(() => {
  const parts = [props.city, props.address].filter(Boolean)

  return parts.join(', ')
})
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <article class="overview-panel">
      <p class="editorial-kicker editorial-kicker-leaf text-stone-500 dark:text-stone-400">
        {{ t('reviewsTitle') }}
      </p>

      <div
        v-if="reviewScore !== null && reviewCount > 0"
        class="mt-4 flex flex-1 flex-col"
      >
        <UiAnimatedScore
          :score="reviewScore"
          :locale="locale"
        />

        <div class="mt-3 space-y-1">
          <p
            v-if="reviewLabel"
            class="font-medium text-stone-900 dark:text-stone-50"
          >
            {{ reviewLabel }}
          </p>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            {{ $t('review.totalCount', reviewCount, { count: reviewCount }) }}
          </p>
        </div>

        <button
          type="button"
          class="link-forest mt-4 text-left text-sm"
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

    <article class="overview-panel">
      <p class="editorial-kicker editorial-kicker-leaf text-stone-500 dark:text-stone-400">
        {{ t('amenitiesTitle') }}
      </p>

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
        class="link-forest mt-4 text-left text-sm"
        @click="emit('scrollToAmenities')"
      >
        {{ t('allAmenities') }}
      </button>
    </article>

    <article class="overview-panel sm:col-span-2 lg:col-span-1">
      <p class="editorial-kicker editorial-kicker-leaf text-stone-500 dark:text-stone-400">
        {{ t('locationTitle') }}
      </p>

      <p class="mt-3 flex-1 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        {{ locationLine }}
      </p>

      <button
        v-if="hasMap"
        type="button"
        class="link-forest mt-4 inline-flex items-center gap-1.5 text-sm"
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
