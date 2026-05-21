<script setup lang="ts">
import { REVIEW_PHOTO_MAX_BYTES } from '#shared/utils/media-limits'
import { REVIEW_RATING_DIMENSIONS, type ReviewRatingDimension, type ReviewRatings } from '#shared/types/review-ratings'
import type { ReviewFormEmits, ReviewFormProps } from './types'

withDefaults(defineProps<ReviewFormProps>(), {
  loading: false,
})

const emit = defineEmits<ReviewFormEmits>()

const createEmptyRatings = (): ReviewRatings => ({
  cleanliness: 0,
  checkIn: 0,
  location: 0,
  photoMatch: 0,
  value: 0,
  service: 0,
})

const ratings = ref<ReviewRatings>(createEmptyRatings())
const text = ref('')
const error = ref('')
const photoFiles = ref<File[]>([])
const photoPreviews = ref<string[]>([])
const { t } = useI18n()

const setDimensionRating = (dimension: ReviewRatingDimension, value: number) => {
  ratings.value = { ...ratings.value, [dimension]: value }
}

const onPhotosSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = [...(input.files ?? [])]

  for (const file of files) {
    if (file.size > REVIEW_PHOTO_MAX_BYTES) {
      error.value = t('review.photosHint')
      continue
    }

    photoFiles.value = [...photoFiles.value, file]
    photoPreviews.value = [...photoPreviews.value, URL.createObjectURL(file)]
  }

  input.value = ''
}

const removePhoto = (index: number) => {
  const url = photoPreviews.value[index]
  if (url) {
    URL.revokeObjectURL(url)
  }

  photoFiles.value = photoFiles.value.filter((_, i) => i !== index)
  photoPreviews.value = photoPreviews.value.filter((_, i) => i !== index)
}

const handleSubmit = () => {
  error.value = ''

  const missingDimension = REVIEW_RATING_DIMENSIONS.find(dimension => ratings.value[dimension] < 1)

  if (missingDimension) {
    error.value = t('review.selectAllRatings')
    return
  }

  if (text.value.trim().length < 10) {
    error.value = t('review.minLength')
    return
  }

  emit('submitReview', {
    ratings: { ...ratings.value },
    text: text.value.trim(),
    photos: [...photoFiles.value],
  })
}

onBeforeUnmount(() => {
  for (const url of photoPreviews.value) {
    URL.revokeObjectURL(url)
  }
})
</script>

<template>
  <form
    class="surface-card space-y-5 p-5"
    data-testid="review-form"
    @submit.prevent="handleSubmit()"
  >
    <div class="space-y-4">
      <FormLabel required>
        {{ $t('review.ratingsTitle') }}
      </FormLabel>
      <p class="text-xs text-stone-500 dark:text-stone-400">
        {{ $t('review.ratingsHint') }}
      </p>

      <div
        v-for="dimension in REVIEW_RATING_DIMENSIONS"
        :key="dimension"
        class="space-y-2"
      >
        <p class="text-sm font-medium text-stone-800 dark:text-stone-200">
          {{ $t(`review.dimensions.${dimension}`) }}
        </p>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="value in 10"
            :key="`${dimension}-${value}`"
            type="button"
            :data-testid="`review-rating-${dimension}-${value}`"
            :aria-label="$t('review.ratingAriaLabel', { value, dimension: $t(`review.dimensions.${dimension}`) })"
            :aria-pressed="value <= ratings[dimension]"
            class="min-w-8 rounded-lg px-2 py-1 text-sm font-medium tabular-nums transition"
            :class="value <= ratings[dimension]
              ? 'bg-brand-600 text-white dark:bg-brand-500'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'"
            @click="setDimensionRating(dimension, value)"
          >
            {{ value }}
          </button>
        </div>
      </div>
    </div>

    <FormTextarea
      v-model="text"
      :label="$t('review.text')"
      :rows="4"
      required
    />

    <div class="space-y-2">
      <p class="form-label">
        {{ $t('review.photos') }}
      </p>
      <p class="text-xs text-stone-500 dark:text-stone-400">
        {{ $t('review.photosHint') }}
      </p>
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800">
        <Icon
          name="ph:camera-duotone"
          class="size-5"
        />
        {{ $t('review.addPhotos') }}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          class="sr-only"
          @change="onPhotosSelected"
        >
      </label>
      <div
        v-if="photoPreviews.length"
        class="flex flex-wrap gap-2"
        data-testid="review-form-photo-previews"
      >
        <div
          v-for="(preview, index) in photoPreviews"
          :key="preview"
          class="relative size-22 overflow-hidden rounded-2xl ring-1 ring-stone-200/80 dark:ring-stone-700/80"
        >
          <img
            :src="preview"
            alt=""
            class="h-full w-full object-cover"
          >
          <button
            type="button"
            class="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-stone-900/70 text-white"
            @click="removePhoto(index)"
          >
            <Icon
              name="ph:x"
              class="size-3"
            />
          </button>
        </div>
      </div>
    </div>

    <p
      v-if="error"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ error }}
    </p>

    <UiButton
      type="submit"
      :loading="loading"
    >
      {{ $t('review.submit') }}
    </UiButton>
  </form>
</template>
