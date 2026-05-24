<script setup lang="ts">
import { computeOverallRating } from '#shared/utils/review-rating'
import { formatUserInitials } from '#shared/utils/user-display'
import type { ReviewReply } from '#shared/types/review'
import type { ReviewCardProps } from './types'

const props = withDefaults(defineProps<ReviewCardProps>(), {
  canReplyToReview: false,
  showPendingBadge: false,
})

const emit = defineEmits<{
  refresh: []
}>()

const { locale, t } = useI18n()

const canReplyToReply = (reply: ReviewReply) =>
  props.canReplyToReply?.(reply) ?? false

const overallScore = computed(() => computeOverallRating(props.review.ratings))

const relativeDate = computed(() => {
  const created = new Date(props.review.createdAt)
  const diffMs = Date.now() - created.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 1) {
    return t('review.postedToday')
  }

  if (diffDays < 7) {
    return t('review.postedDaysAgo', { count: diffDays })
  }

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 5) {
    return t('review.postedWeeksAgo', { count: diffWeeks })
  }

  return created.toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })
})

const stayPeriodLabel = computed(() => {
  if (!props.review.stay) {
    return null
  }

  const checkIn = new Date(`${props.review.stay.checkIn}T12:00:00`)
  const monthYear = checkIn.toLocaleDateString(locale.value, { month: 'long', year: 'numeric' })
  const nights = props.review.stay.nights

  return t('review.stayPeriod', {
    period: monthYear.charAt(0).toUpperCase() + monthYear.slice(1),
    nights,
    nightsLabel: t('review.nights', { count: nights }),
  })
})

const guestsLabel = computed(() => {
  if (!props.review.stay) {
    return null
  }

  return t('review.stayGuests', { count: props.review.stay.guests })
})

const authorInitial = computed(() => {
  if (props.review.authorName) {
    return formatUserInitials(props.review.authorName)
  }

  return formatUserInitials(t('review.anonymousGuest'))
})

const authorName = computed(() => props.review.authorName ?? t('review.anonymousGuest'))
</script>

<template>
  <article
    data-testid="review-card"
    class="surface-card overflow-hidden p-5 sm:p-6"
  >
    <div class="flex flex-col gap-5 sm:flex-row sm:gap-6">
      <aside class="flex shrink-0 gap-3 sm:w-44 sm:flex-col sm:gap-3">
        <div
          class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-brand-100 to-stone-100 text-base font-semibold text-brand-800 ring-2 ring-brand-200/80 dark:from-brand-950 dark:to-stone-800 dark:text-brand-200 dark:ring-brand-800/80"
          aria-hidden="true"
        >
          {{ authorInitial }}
        </div>

        <div class="min-w-0 space-y-2">
          <p class="font-semibold leading-tight text-stone-900 dark:text-stone-50">
            {{ authorName }}
          </p>

          <ul
            v-if="stayPeriodLabel || guestsLabel"
            class="space-y-1.5 text-xs text-stone-500 dark:text-stone-400"
          >
            <li
              v-if="stayPeriodLabel"
              class="inline-flex items-start gap-1.5"
            >
              <Icon
                name="ph:calendar-blank-duotone"
                class="mt-0.5 size-3.5 shrink-0 text-brand-600/70 dark:text-brand-400/80"
              />
              <span>{{ stayPeriodLabel }}</span>
            </li>
            <li
              v-if="guestsLabel"
              class="inline-flex items-start gap-1.5"
            >
              <Icon
                name="ph:users-duotone"
                class="mt-0.5 size-3.5 shrink-0 text-brand-600/70 dark:text-brand-400/80"
              />
              <span>{{ guestsLabel }}</span>
            </li>
          </ul>
        </div>
      </aside>

      <div class="min-w-0 flex-1 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-stone-100 pb-4 dark:border-stone-800">
          <div class="flex flex-wrap items-center gap-2">
            <ReviewScoreBadge
              :score="overallScore"
              size="sm"
            />
            <UiBadge
              v-if="showPendingBadge"
              variant="muted"
            >
              {{ $t('review.pendingModeration') }}
            </UiBadge>
          </div>
          <time
            :datetime="review.createdAt"
            class="inline-flex shrink-0 items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400"
          >
            <Icon
              name="ph:clock-duotone"
              class="size-4"
              aria-hidden="true"
            />
            {{ relativeDate }}
          </time>
        </div>

        <div
          v-if="review.photos?.length"
          class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5"
          data-testid="review-photo-gallery"
        >
          <a
            v-for="photo in review.photos"
            :key="photo.id"
            :href="photo.url"
            target="_blank"
            rel="noopener noreferrer"
            class="size-22 shrink-0 overflow-hidden rounded-2xl ring-1 ring-stone-200/80 transition hover:ring-2 hover:ring-brand-400 dark:ring-stone-700/80 dark:hover:ring-brand-500"
          >
            <img
              :src="photo.url"
              alt=""
              class="h-full w-full object-cover"
              loading="lazy"
            >
          </a>
        </div>

        <p class="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          {{ review.text }}
        </p>

        <ReviewReplyThread
          v-if="replyLabels"
          :review-id="review.id"
          :replies="review.replies"
          :labels="replyLabels"
          :can-reply-to-review="canReplyToReview"
          :can-reply-to-reply="canReplyToReply"
          @refresh="emit('refresh')"
        />
      </div>
    </div>
  </article>
</template>
