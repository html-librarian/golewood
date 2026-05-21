<script setup lang="ts">
import { BOOKING_STATUS_LABELS } from '#shared/types/booking'
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'max',
  middleware: 'max-bridge',
})

const route = useRoute()
const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { locale } = useI18n()
const { fetchHostBookings, fetchGuestBookings, confirmBooking, cancelBooking } = useBookings()
const {
  showBackButton,
  isMaxHost,
  hapticImpact,
  hapticSuccess,
  hapticError,
  hapticSelection,
  subscribeVisibilityRefresh,
} = useMaxBridge()

const highlightedBookingId = computed(() =>
  typeof route.query.booking === 'string' ? route.query.booking : null,
)

const fetchBookings = () =>
  isMaxHost.value ? fetchHostBookings() : fetchGuestBookings()

const { data: bookings, refresh, pending } = await useAsyncData('max-bookings', fetchBookings, {
  watch: [isMaxHost],
})

const upcoming = computed(() =>
  (bookings.value ?? []).filter(booking => ['pending', 'confirmed'].includes(booking.status)),
)

const pageTitle = computed(() => (isMaxHost.value ? t('titleHost') : t('titleGuest')))

const handleConfirm = async (id: string) => {
  hapticImpact('medium')

  try {
    await confirmBooking(id)
    await refresh()
    hapticSuccess()
  } catch {
    hapticError()
  }
}

const handleCancel = async (id: string) => {
  hapticImpact('light')

  try {
    await cancelBooking(id)
    await refresh()
    hapticSuccess()
  } catch {
    hapticError()
  }
}

let teardownBack: (() => void) | undefined
let teardownVisibility: (() => void) | undefined

onMounted(() => {
  teardownBack = showBackButton(() => {
    hapticSelection()
    navigateTo(localePath('/max'))
  })

  teardownVisibility = subscribeVisibilityRefresh(refresh)
})

onUnmounted(() => {
  teardownBack?.()
  teardownVisibility?.()
})
</script>

<template>
  <div class="mx-auto max-w-md space-y-4">
    <h1 class="font-display text-2xl font-semibold">
      {{ pageTitle }}
    </h1>

    <p
      v-if="pending"
      class="text-sm text-stone-600 dark:text-stone-400"
    >
      …
    </p>

    <p
      v-else-if="!upcoming.length"
      class="text-sm text-stone-600 dark:text-stone-400"
    >
      {{ t('empty') }}
    </p>

    <article
      v-for="booking in upcoming"
      :key="booking.id"
      class="surface-card space-y-3 p-4"
      :class="booking.id === highlightedBookingId
        ? 'ring-2 ring-brand-500 dark:ring-brand-400'
        : ''"
      :data-testid="booking.id === highlightedBookingId ? 'max-booking-highlighted' : undefined"
    >
      <div>
        <h2 class="font-semibold">
          {{ booking.listing.title }}
        </h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{ booking.checkIn }} → {{ booking.checkOut }}
        </p>
        <UiBadge
          class="mt-2"
          variant="muted"
        >
          {{ BOOKING_STATUS_LABELS[booking.status][locale as 'ru' | 'en'] }}
        </UiBadge>
      </div>
      <p class="font-semibold">
        {{ formatPrice(booking.totalPrice) }}
      </p>
      <UiButton
        v-if="isMaxHost && booking.status === 'pending'"
        class="w-full"
        @click="handleConfirm(booking.id)"
      >
        {{ t('confirm') }}
      </UiButton>
      <UiButton
        v-else-if="!isMaxHost && ['pending', 'confirmed'].includes(booking.status)"
        variant="outline"
        class="w-full"
        @click="handleCancel(booking.id)"
      >
        {{ t('cancel') }}
      </UiButton>
    </article>
  </div>
</template>
