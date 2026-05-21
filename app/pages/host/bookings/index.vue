<script setup lang="ts">
import { BOOKING_STATUS_LABELS } from '#shared/types/booking'
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const { locale } = useI18n()
const { fetchHostBookings, confirmBooking, completeBooking, cancelBooking } = useBookings()

const { data: bookings, refresh, pending } = await useAsyncData('host-bookings', () => fetchHostBookings())

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

const handleConfirm = async (id: string) => {
  await confirmBooking(id)
  await refresh()
}

const handleComplete = async (id: string) => {
  await completeBooking(id)
  await refresh()
}

const handleCancel = async (id: string) => {
  await cancelBooking(id)
  await refresh()
}
</script>

<template>
  <div class="page-container max-w-4xl">
    <h1 class="section-title mb-6">
      {{ t('title') }}
    </h1>

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
        class="surface-card space-y-3 p-4"
      >
        <UiSkeleton variant="title" class="w-2/3" />
        <UiSkeleton class="w-1/2" />
        <UiSkeleton class="w-1/4" />
      </div>
    </div>

    <UiEmpty
      v-else-if="!filteredBookings.length"
      icon="ph:calendar-blank-duotone"
      :title="bookings?.length ? t('emptyFiltered') : t('empty')"
    />

    <div
      v-else
      class="space-y-4"
    >
      <article
        v-for="booking in filteredBookings"
        :key="booking.id"
        class="surface-card p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="font-semibold text-stone-900 dark:text-stone-100">
              {{ booking.listing.title }}
            </h2>
            <p class="text-sm text-stone-600 dark:text-stone-400">
              {{ booking.checkIn }} → {{ booking.checkOut }} · {{ booking.guests }} {{ t('guests') }}
            </p>
            <UiBadge
              class="mt-2"
              variant="muted"
            >
              {{ BOOKING_STATUS_LABELS[booking.status][locale as 'ru' | 'en'] }}
            </UiBadge>
          </div>
          <div class="flex flex-col gap-2 text-right">
            <p class="text-xs text-stone-500 dark:text-stone-400">
              {{ t('guestPaid') }}
            </p>
            <p class="font-semibold text-stone-900 dark:text-stone-100">
              {{ formatPrice(booking.totalPrice) }}
            </p>
            <dl class="space-y-0.5 text-sm text-stone-600 dark:text-stone-400">
              <div class="flex justify-end gap-3">
                <dt>{{ t('yourPayout') }}</dt>
                <dd class="tabular-nums text-emerald-800 dark:text-emerald-300">
                  {{ formatPrice(booking.hostAmount) }}
                </dd>
              </div>
              <div class="flex justify-end gap-3">
                <dt>{{ t('platformFee') }}</dt>
                <dd class="tabular-nums">
                  {{ formatPrice(booking.platformFee) }}
                </dd>
              </div>
              <div
                v-if="booking.giftCertificateCredit > 0"
                class="flex justify-end gap-3 text-brand-800 dark:text-brand-300"
              >
                <dt>{{ t('giftCertificate') }}</dt>
                <dd class="tabular-nums">
                  −{{ formatPrice(booking.giftCertificateCredit) }}
                </dd>
              </div>
            </dl>
            <UiButton
              v-if="booking.status === 'pending'"
              @click="handleConfirm(booking.id)"
            >
              {{ t('confirm') }}
            </UiButton>
            <UiButton
              v-if="booking.status === 'confirmed'"
              @click="handleComplete(booking.id)"
            >
              {{ t('complete') }}
            </UiButton>
            <UiButton
              v-if="['pending', 'confirmed'].includes(booking.status)"
              variant="secondary"
              @click="handleCancel(booking.id)"
            >
              {{ t('cancel') }}
            </UiButton>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
