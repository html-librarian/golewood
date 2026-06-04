<script setup lang="ts">
import { staggerDelayMs } from '#shared/utils/stagger-delay'
import { formatPrice } from '#shared/utils/format'
import { isPaymentPaid } from '#shared/types/payment'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth' })

const { t } = usePageI18n({ ru, en })
const { locale } = useI18n()
const bookingLocale = computed((): 'ru' | 'en' => (locale.value === 'en' ? 'en' : 'ru'))
const localePath = useLocalePath()
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

const listAnimKey = computed(() => `${statusFilter.value}-${filteredBookings.value.length}`)

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
    <UiPageHeader
      :title="t('title')"
      :subtitle="t('subtitle')"
    />

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
        class="surface-card overflow-hidden"
      >
        <div class="flex flex-col sm:flex-row">
          <UiSkeleton
            variant="card"
            class="aspect-video sm:aspect-auto sm:h-36 sm:w-44"
          />
          <div class="space-y-3 p-5">
            <UiSkeleton variant="title" class="w-2/3" />
            <UiSkeleton class="w-1/2" />
            <UiSkeleton class="w-1/3" />
          </div>
        </div>
      </div>
    </div>

    <UiEmpty
      v-else-if="!filteredBookings.length"
      icon="ph:suitcase-duotone"
      brand
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
      <div
        v-for="(booking, index) in filteredBookings"
        :key="`${listAnimKey}-${booking.id}`"
        class="search-result-enter"
        :style="{ animationDelay: `${staggerDelayMs(index, 45, 360)}ms` }"
      >
        <BookingGuestCard
          :booking="booking"
          :locale="bookingLocale"
          :refund-hint="refundHint(booking)"
          :reported="reportedBookingIds.includes(booking.id)"
          :show-report-form="reportingBookingId === booking.id"
          :report-loading="reportLoading"
          @cancel="handleCancel(booking.id)"
          @report-toggle="reportingBookingId = reportingBookingId === booking.id ? null : booking.id"
          @report-submit="handleReportSubmit(booking.id, $event)"
        />
      </div>
    </div>
  </div>
</template>
