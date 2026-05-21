<script setup lang="ts">
import { BOOKING_STATUS_LABELS } from '#shared/types/booking'
import { PAYMENT_STATUS_LABELS, isPaymentPaid } from '#shared/types/payment'
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth' })

const { t } = usePageI18n({ ru, en })
const { locale } = useI18n()
const localePath = useLocalePath()
const { user } = useAuth()
const { fetchGuestBookings, cancelBooking } = useBookings()
const { createReport } = useReports()

const { data: bookings, refresh, pending } = await useAsyncData('guest-bookings', () => fetchGuestBookings())

const statusFilter = ref<'all' | 'upcoming' | 'past'>('all')

const filteredBookings = computed(() => {
  if (!bookings.value) {
    return []
  }

  if (statusFilter.value === 'upcoming') {
    return bookings.value.filter(booking => ['pending', 'confirmed'].includes(booking.status))
  }

  if (statusFilter.value === 'past') {
    return bookings.value.filter(booking => ['completed', 'cancelled'].includes(booking.status))
  }

  return bookings.value
})

const reportingBookingId = ref<string | null>(null)
const reportLoading = ref(false)
const reportedBookingIds = ref<string[]>([])

const handleCancel = async (id: string) => {
  await cancelBooking(id)
  await refresh()
}

const handleReportSubmit = async (bookingId: string, reason: string) => {
  reportLoading.value = true

  try {
    await createReport({ type: 'booking', bookingId, reason })
    reportedBookingIds.value.push(bookingId)
    reportingBookingId.value = null
  } finally {
    reportLoading.value = false
  }
}

const refundHint = (booking: NonNullable<typeof bookings.value>[number]) => {
  if (!booking.refundPreview || !isPaymentPaid(booking.payment?.status ?? 'pending')) {
    return null
  }

  const { amount, percent } = booking.refundPreview

  if (amount <= 0) {
    return t('refundNone')
  }

  if (percent === 100) {
    return t('refundFull', { amount: formatPrice(amount) })
  }

  return t('refundPartial', { amount: formatPrice(amount), percent })
}
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <NuxtLink
        v-if="user?.role === 'guest'"
        :to="localePath('/stories')"
        class="mt-4 inline-flex flex-col rounded-xl border border-brand-200/80 bg-brand-50/60 px-4 py-3 transition hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-950/40 dark:hover:bg-brand-950/60"
      >
        <span class="font-medium text-brand-800 dark:text-brand-300">{{ t('myStoriesLink') }}</span>
        <span class="text-sm text-brand-700/80 dark:text-brand-400/90">{{ t('myStoriesHint') }}</span>
      </NuxtLink>
    </div>

    <div class="mb-6 flex flex-wrap gap-2">
      <button
        v-for="option in ['all', 'upcoming', 'past'] as const"
        :key="option"
        type="button"
        class="chip"
        :class="statusFilter === option ? 'chip-active' : 'chip-inactive'"
        @click="statusFilter = option"
      >
        {{ t(`filters.${option}`) }}
      </button>
    </div>

    <div
      v-if="pending"
      class="space-y-4"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="surface-card space-y-3 p-5"
      >
        <UiSkeleton variant="title" class="w-2/3" />
        <UiSkeleton class="w-1/2" />
        <UiSkeleton class="w-1/3" />
      </div>
    </div>

    <UiEmpty
      v-else-if="!filteredBookings.length"
      icon="ph:suitcase-duotone"
      :title="bookings?.length ? t('emptyFiltered') : t('empty')"
      :description="bookings?.length ? undefined : t('emptyDescription')"
    >
      <NuxtLink
        v-if="!bookings?.length"
        :to="localePath('/search')"
      >
        <UiButton>{{ t('explore') }}</UiButton>
      </NuxtLink>
    </UiEmpty>

    <div
      v-else
      class="space-y-4"
    >
      <article
        v-for="booking in filteredBookings"
        :key="booking.id"
        class="surface-card p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
              {{ booking.listing.title }}
            </h2>
            <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {{ booking.listing.city }} · {{ booking.checkIn }} → {{ booking.checkOut }}
            </p>
            <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {{ BOOKING_STATUS_LABELS[booking.status][locale as 'ru' | 'en'] }}
            </p>
            <p
              v-if="booking.payment"
              class="text-sm text-stone-500 dark:text-stone-400"
            >
              {{ PAYMENT_STATUS_LABELS[booking.payment.status][locale as 'ru' | 'en'] }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xl font-semibold text-stone-900 dark:text-stone-50">
              {{ formatPrice(booking.totalPrice) }}
            </p>
            <p
              v-if="booking.giftCertificateCredit > 0"
              class="mt-0.5 text-xs text-brand-800 dark:text-brand-300"
            >
              {{ t('giftCertificateApplied', { amount: formatPrice(booking.giftCertificateCredit) }) }}
            </p>
            <NuxtLink
              v-if="booking.status === 'pending' && !isPaymentPaid(booking.payment?.status ?? 'pending')"
              :to="localePath(`/bookings/${booking.id}/pay`)"
              class="mt-2 inline-flex"
            >
              <UiButton size="sm">
                {{ t('pay') }}
              </UiButton>
            </NuxtLink>
            <NuxtLink
              v-if="booking.canReview"
              :to="localePath(`/listings/${booking.listing.id}?leaveReview=${booking.id}`)"
              class="mt-2 inline-flex"
            >
              <UiButton
                variant="outline"
                size="sm"
              >
                {{ t('leaveReview') }}
              </UiButton>
            </NuxtLink>
            <UiButton
              v-if="['pending', 'confirmed'].includes(booking.status)"
              variant="secondary"
              size="sm"
              class="mt-2"
              @click="handleCancel(booking.id)"
            >
              {{ t('cancel') }}
            </UiButton>
            <p
              v-if="refundHint(booking)"
              class="mt-2 max-w-xs text-xs text-stone-500 dark:text-stone-400"
            >
              {{ refundHint(booking) }}
            </p>
            <button
              v-if="!reportedBookingIds.includes(booking.id)"
              type="button"
              class="mt-2 block text-sm text-stone-500 underline hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              @click="reportingBookingId = reportingBookingId === booking.id ? null : booking.id"
            >
              {{ t('report') }}
            </button>
            <p
              v-else
              class="mt-2 text-sm text-green-600 dark:text-green-400"
            >
              {{ t('reported') }}
            </p>
          </div>
        </div>

        <ReportForm
          v-if="reportingBookingId === booking.id"
          class="mt-4"
          :loading="reportLoading"
          @submit="handleReportSubmit(booking.id, $event)"
        />
      </article>
    </div>
  </div>
</template>
