<script setup lang="ts">
import { BOOKING_STATUS_LABELS, type BookingStatus } from '#shared/types/booking'
import { PAYMENT_STATUS_LABELS, isPaymentPaid } from '#shared/types/payment'
import type { UiBadgeVariant } from '~/components/ui/badge/types'
import { formatDisplayDate } from '#shared/utils/calendar'
import { formatPrice } from '#shared/utils/format'
import type { BookingGuestCardEmits, BookingGuestCardProps } from './types'
import ru from './i18n/ru'
import en from './i18n/en'

const props = defineProps<BookingGuestCardProps>()
const emit = defineEmits<BookingGuestCardEmits>()

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()

const listingPath = computed(() => localePath(`/listings/${props.booking.listing.id}`))

const dateRangeLabel = computed(() => {
  const checkIn = formatDisplayDate(props.booking.checkIn, props.locale)
  const checkOut = formatDisplayDate(props.booking.checkOut, props.locale)

  return `${checkIn} → ${checkOut}`
})

const bookingStatusVariant = (status: BookingStatus): UiBadgeVariant => {
  if (status === 'pending') {
    return 'warning'
  }

  if (status === 'confirmed') {
    return 'success'
  }

  if (status === 'cancelled') {
    return 'danger'
  }

  return 'muted'
}

const paymentStatusVariant = (): UiBadgeVariant => {
  const status = props.booking.payment?.status ?? 'pending'

  if (isPaymentPaid(status)) {
    return 'success'
  }

  if (status === 'refunded') {
    return 'muted'
  }

  if (status === 'cancelled') {
    return 'danger'
  }

  return 'warning'
}

const needsPayment = computed(() =>
  props.booking.status === 'pending'
  && !isPaymentPaid(props.booking.payment?.status ?? 'pending'),
)
</script>

<template>
  <article class="surface-card overflow-hidden">
    <div class="flex flex-col sm:flex-row">
      <NuxtLink
        :to="listingPath"
        class="relative aspect-video shrink-0 overflow-hidden bg-stone-100 sm:aspect-auto sm:w-44 md:w-52 dark:bg-stone-800"
      >
        <img
          v-if="booking.listing.coverPhotoUrl"
          :src="booking.listing.coverPhotoUrl"
          :alt="booking.listing.title"
          class="size-full object-cover transition duration-500 hover:scale-105"
        >
        <ListingImagePlaceholder
          v-else
          class="size-full"
        />
      </NuxtLink>

      <div class="flex min-w-0 flex-1 flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0 space-y-3">
          <div>
            <NuxtLink
              :to="listingPath"
              class="font-display text-lg font-semibold text-stone-900 transition hover:text-brand-800 dark:text-stone-50 dark:hover:text-brand-300"
            >
              {{ booking.listing.title }}
            </NuxtLink>
            <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {{ booking.listing.city }}
            </p>
          </div>

          <p class="inline-flex items-center gap-2 text-sm font-medium text-stone-800 dark:text-stone-200">
            <Icon
              name="ph:calendar-blank-duotone"
              class="size-4 shrink-0 text-brand-700 dark:text-brand-400"
            />
            {{ dateRangeLabel }}
          </p>

          <div class="flex flex-wrap items-center gap-2">
            <UiBadge :variant="bookingStatusVariant(booking.status)">
              {{ BOOKING_STATUS_LABELS[booking.status][locale] }}
            </UiBadge>
            <UiBadge
              v-if="booking.payment"
              :variant="paymentStatusVariant()"
            >
              {{ PAYMENT_STATUS_LABELS[booking.payment.status][locale] }}
            </UiBadge>
          </div>
        </div>

        <div class="flex shrink-0 flex-col gap-2 sm:items-end">
          <div class="sm:text-right">
            <p class="text-xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
              {{ formatPrice(booking.totalPrice) }}
            </p>
            <p
              v-if="booking.giftCertificateCredit > 0"
              class="mt-0.5 text-xs text-brand-800 dark:text-brand-300"
            >
              {{ t('giftCertificateApplied', { amount: formatPrice(booking.giftCertificateCredit) }) }}
            </p>
          </div>

          <NuxtLink
            v-if="needsPayment"
            :to="localePath(`/bookings/${booking.id}/pay`)"
            class="inline-flex w-full sm:w-auto"
          >
            <UiButton
              size="sm"
              class="w-full sm:w-auto"
            >
              {{ t('pay') }}
            </UiButton>
          </NuxtLink>

          <NuxtLink
            v-if="booking.canReview"
            :to="localePath(`/listings/${booking.listing.id}?leaveReview=${booking.id}`)"
            class="inline-flex w-full sm:w-auto"
          >
            <UiButton
              variant="outline"
              size="sm"
              class="w-full sm:w-auto"
            >
              {{ t('leaveReview') }}
            </UiButton>
          </NuxtLink>

          <UiButton
            v-if="['pending', 'confirmed'].includes(booking.status)"
            variant="secondary"
            size="sm"
            class="w-full sm:w-auto"
            @click="emit('cancel')"
          >
            {{ t('cancel') }}
          </UiButton>

          <p
            v-if="refundHint"
            class="max-w-xs text-xs text-stone-500 sm:text-right dark:text-stone-400"
          >
            {{ refundHint }}
          </p>

          <button
            v-if="!reported"
            type="button"
            class="text-left text-sm text-stone-500 underline hover:text-stone-700 sm:text-right dark:text-stone-400 dark:hover:text-stone-200"
            @click="emit('reportToggle')"
          >
            {{ t('report') }}
          </button>
          <p
            v-else
            class="text-sm text-green-600 sm:text-right dark:text-green-400"
          >
            {{ t('reported') }}
          </p>
        </div>
      </div>
    </div>

    <ReportForm
      v-if="showReportForm"
      class="border-t border-stone-100 px-5 pb-5 pt-4 dark:border-stone-800"
      :loading="reportLoading"
      @submit="emit('reportSubmit', $event)"
    />
  </article>
</template>
