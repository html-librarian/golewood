<script setup lang="ts">
import type { BookingWithListing } from '#shared/types/booking'
import { PAYMENT_STATUS_LABELS, isPaymentPaid } from '#shared/types/payment'
import { formatPrice } from '#shared/utils/format'
import { getBookingCashDue } from '#shared/utils/bonus'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth', pageTransition: false })

const { t } = usePageI18n({ ru, en })
const { locale } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { fetchGuestBookingById } = useBookings()
const { createPayment, fetchPayment } = usePayments()

const bookingId = computed(() => String(route.params.id))
const paying = ref(false)
const payError = ref('')
const booking = ref<BookingWithListing | null>(null)
const bookingPending = ref(true)

onMounted(async () => {
  bookingPending.value = true

  try {
    booking.value = await fetchGuestBookingById(bookingId.value)

    if (
      booking.value
      && getBookingCashDue(booking.value.totalPrice, booking.value.bonusApplied) <= 0
      && booking.value.bonusApplied > 0
    ) {
      await createPayment(bookingId.value)
      await refreshPayment()
    }
  } catch {
    booking.value = null
  } finally {
    bookingPending.value = false
  }
})

const { data: payment, refresh: refreshPayment } = await useAsyncData(
  () => `payment-${bookingId.value}`,
  () => fetchPayment(bookingId.value, route.query.return === '1'),
  { server: false, lazy: true },
)

const isPaid = computed(() => payment.value && isPaymentPaid(payment.value.status))

const cashDue = computed(() => {
  if (!booking.value) {
    return 0
  }

  return getBookingCashDue(booking.value.totalPrice, booking.value.bonusApplied)
})

const paidFullyWithBonuses = computed(() => booking.value && cashDue.value <= 0 && booking.value.bonusApplied > 0)

const paySteps = computed(() => [
  { label: t('stepBooked') },
  { label: t('stepPayment') },
  { label: t('stepConfirm') },
])

const payStepCurrent = computed(() => (isPaid.value ? 3 : 2))

const handlePay = async () => {
  paying.value = true
  payError.value = ''

  try {
    const result = await createPayment(bookingId.value)
    await refreshPayment()

    if (result.confirmationUrl) {
      await navigateTo(result.confirmationUrl, { external: true })
    }
  } catch (error: unknown) {
    const err = error as { data?: { code?: string, statusMessage?: string } }
    const payoutBlocked = err.data?.code === 'HOST_PAYOUT_NOT_READY'
      || err.data?.statusMessage === 'HOST_PAYOUT_NOT_READY'
    payError.value = payoutBlocked ? t('hostPayoutNotReady') : t('paymentFailed')
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <div class="page-container max-w-lg">
    <UiEmpty
      v-if="!bookingPending && !booking"
      icon="ph:receipt-duotone"
      :title="t('notFound')"
    />

    <div
      v-if="bookingPending"
      class="space-y-6"
    >
      <UiSkeleton variant="title" class="w-2/3" />
      <div class="flex gap-2">
        <UiSkeleton
          v-for="n in 3"
          :key="n"
          class="h-8 flex-1 rounded-full"
        />
      </div>
      <div class="surface-card space-y-3 p-5">
        <UiSkeleton variant="title" />
        <UiSkeleton class="w-3/4" />
        <UiSkeleton variant="title" class="w-1/3" />
      </div>
      <UiSkeleton variant="button" class="w-full" />
    </div>

    <div
      v-else-if="booking"
      class="space-y-6"
    >
      <h1 class="section-title">
        {{ t('title') }}
      </h1>

      <UiStepper
        :steps="paySteps"
        :current="payStepCurrent"
      />

      <article class="surface-card p-5">
        <h2 class="font-semibold text-stone-900 dark:text-stone-100">
          {{ booking.listing.title }}
        </h2>
        <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {{ booking.listing.city }} · {{ booking.checkIn }} → {{ booking.checkOut }}
        </p>
        <dl class="mt-3 space-y-1 text-sm">
          <div
            v-if="booking.giftCertificateCredit > 0"
            class="flex justify-between gap-3 text-stone-600 dark:text-stone-400"
          >
            <dt>{{ t('subtotal') }}</dt>
            <dd class="tabular-nums">
              {{ formatPrice(booking.totalPrice + booking.giftCertificateCredit) }}
            </dd>
          </div>
          <div
            v-if="booking.giftCertificateCredit > 0"
            class="flex justify-between gap-3 text-brand-800 dark:text-brand-300"
          >
            <dt>{{ t('giftCertificate') }}</dt>
            <dd class="tabular-nums">−{{ formatPrice(booking.giftCertificateCredit) }}</dd>
          </div>
          <div class="flex justify-between gap-3 text-stone-600 dark:text-stone-400">
            <dt>{{ t('total') }}</dt>
            <dd class="tabular-nums">{{ formatPrice(booking.totalPrice) }}</dd>
          </div>
          <div
            v-if="booking.bonusApplied > 0"
            class="flex justify-between gap-3 text-brand-800 dark:text-brand-300"
          >
            <dt>{{ t('bonusApplied') }}</dt>
            <dd class="tabular-nums">−{{ formatPrice(booking.bonusApplied) }}</dd>
          </div>
          <div class="flex justify-between gap-3 text-lg font-semibold text-stone-900 dark:text-stone-100">
            <dt>{{ paidFullyWithBonuses ? t('paidWithBonuses') : t('cashDue') }}</dt>
            <dd class="tabular-nums">{{ formatPrice(cashDue) }}</dd>
          </div>
        </dl>

        <p
          v-if="payment"
          class="mt-2 text-sm text-stone-500 dark:text-stone-400"
        >
          {{ PAYMENT_STATUS_LABELS[payment.status][locale as 'ru' | 'en'] }}
        </p>
      </article>

      <p
        v-if="isPaid || paidFullyWithBonuses"
        class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
      >
        {{ paidFullyWithBonuses && !isPaid ? t('paidWithBonuses') : t('success') }}
      </p>

      <template v-else-if="cashDue > 0">
        <p class="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
          <Icon
            name="ph:shield-check-duotone"
            class="size-5 shrink-0 text-brand-600"
          />
          {{ t('returnHint') }}
        </p>

        <UiButton
          class="w-full"
          :loading="paying"
          @click="handlePay()"
        >
          {{ t('payNow') }}
        </UiButton>

        <p
          v-if="payError"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ payError }}
        </p>
      </template>

      <NuxtLink
        :to="localePath('/bookings')"
        class="inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        {{ t('backToBookings') }}
      </NuxtLink>
    </div>
  </div>
</template>
