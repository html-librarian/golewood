<script setup lang="ts">
import { countNights } from '#shared/utils/dates'
import { formatPrice } from '#shared/utils/format'
import { BONUS_MAX_BOOKING_PERCENT, getBookingCashDue, getMaxBonusForBooking } from '#shared/utils/bonus'
import { PLATFORM_FEE_PERCENT } from '#shared/constants/platform-fee'
import { calculateBookingPrice } from '#shared/utils/pricing'
import type { BookingSummaryEmits, BookingSummaryProps } from './types'

const props = withDefaults(defineProps<BookingSummaryProps>(), {
  maxGuestsIncluded: 1,
  maxGuests: 16,
  extraGuestsOffered: false,
  loading: false,
  transferOffered: false,
  transferPrice: null,
  transferPriceOnRequest: false,
  includeTransfer: false,
  bonusBalance: 0,
  bonusToApply: 0,
  showGiftCertificate: false,
  giftCertificateCode: '',
  giftCertificateCredit: 0,
})
const emit = defineEmits<BookingSummaryEmits>()

const { previewRedemption } = useGiftCertificates()

const giftCodeDraft = ref(props.giftCertificateCode)
const giftCertLoading = ref(false)
const giftCertError = ref('')

watch(() => props.giftCertificateCode, (value) => {
  giftCodeDraft.value = value
})

const appliedGiftCredit = computed(() => {
  if (!pricing.value || props.giftCertificateCredit <= 0) {
    return 0
  }

  return Math.min(props.giftCertificateCredit, pricing.value.total)
})

const totalAfterGift = computed(() => {
  if (!pricing.value) {
    return 0
  }

  return Math.max(0, pricing.value.total - appliedGiftCredit.value)
})

const nights = computed(() =>
  props.checkIn && props.checkOut ? countNights(props.checkIn, props.checkOut) : 0,
)

const transferCharge = computed(() => {
  if (!props.transferOffered || !props.includeTransfer || props.transferPriceOnRequest) {
    return 0
  }

  return props.transferPrice ?? 0
})

const pricing = computed(() =>
  nights.value > 0
    ? calculateBookingPrice(nights.value, props.pricePerNight, {
        transferPrice: transferCharge.value,
        transferOnRequest: props.includeTransfer && props.transferPriceOnRequest,
        guests: props.guests,
        maxGuestsIncluded: props.maxGuestsIncluded,
        extraGuestPricePerNight: props.extraGuestsOffered
          ? (props.extraGuestPricePerNight ?? 0)
          : 0,
      })
    : null,
)

const extraGuestsHint = computed(() => {
  if (!props.extraGuestsOffered || !props.extraGuestPricePerNight) {
    return ''
  }

  return t('booking.extraGuestsHint', {
    included: props.maxGuestsIncluded,
    price: formatPrice(props.extraGuestPricePerNight),
  })
})

const maxBonus = computed(() => {
  if (!pricing.value || props.bonusBalance <= 0) {
    return 0
  }

  return getMaxBonusForBooking(totalAfterGift.value, props.bonusBalance)
})

const cashDue = computed(() => {
  if (!pricing.value) {
    return null
  }

  return getBookingCashDue(totalAfterGift.value, props.bonusToApply)
})

const useBonus = computed({
  get: () => props.bonusToApply > 0,
  set: (enabled: boolean) => {
    emit('update:bonusToApply', enabled ? maxBonus.value : 0)
  },
})

watch(maxBonus, (value, previous) => {
  if (props.bonusToApply > value) {
    emit('update:bonusToApply', value)
  } else if (previous === 0 && value > 0 && props.bonusToApply === 0) {
    return
  }
})

const canBook = computed(() =>
  props.checkIn && props.checkOut && nights.value > 0 && props.guests > 0,
)

const { t } = useI18n()

const nightsLabel = computed(() =>
  nights.value ? `${nights.value} ${t('booking.nights')}` : t('common.emDash'),
)

const showTransferOption = computed(() => props.transferOffered && nights.value > 0)
const showBonusOption = computed(() => pricing.value && maxBonus.value > 0)
const hasAppliedGift = computed(() => appliedGiftCredit.value > 0)

const showCashDueLabel = computed(() => {
  if (!pricing.value || cashDue.value === null) {
    return false
  }

  return cashDue.value !== pricing.value.total
})

const clearGiftCertificate = () => {
  giftCodeDraft.value = ''
  giftCertError.value = ''
  emit('update:giftCertificateCode', '')
  emit('update:giftCertificateCredit', 0)
}

const applyGiftCertificate = async () => {
  const code = giftCodeDraft.value.trim()

  if (code.length < 4) {
    giftCertError.value = t('booking.giftCertificateInvalid')
    return
  }

  giftCertLoading.value = true
  giftCertError.value = ''

  try {
    const { creditRub } = await previewRedemption(props.listingId, { code })
    const normalized = code.toUpperCase()
    giftCodeDraft.value = normalized
    emit('update:giftCertificateCode', normalized)
    emit('update:giftCertificateCredit', creditRub)
  } catch {
    clearGiftCertificate()
    giftCertError.value = t('booking.giftCertificateInvalid')
  } finally {
    giftCertLoading.value = false
  }
}

watch(giftCodeDraft, (value) => {
  if (value.trim().toUpperCase() !== props.giftCertificateCode) {
    giftCertError.value = ''
    if (props.giftCertificateCredit > 0) {
      emit('update:giftCertificateCredit', 0)
      emit('update:giftCertificateCode', '')
    }
  }
})
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="pricing"
      class="space-y-2 border-t border-stone-200 pt-4 text-sm text-stone-700 dark:border-stone-700 dark:text-stone-300"
    >
      <div class="flex justify-between gap-3">
        <span>{{ formatPrice(pricePerNight) }} × {{ nightsLabel }}</span>
        <span class="shrink-0 tabular-nums">{{ pricing ? formatPrice(pricing.subtotal) : t('common.emDash') }}</span>
      </div>

      <div
        v-if="pricing && pricing.extraGuestTotal > 0"
        class="flex justify-between gap-3"
      >
        <span>{{ $t('booking.extraGuests', { count: pricing.extraGuests }) }}</span>
        <span class="shrink-0 tabular-nums">{{ formatPrice(pricing.extraGuestTotal) }}</span>
      </div>

      <div
        v-if="pricing && pricing.serviceFee > 0"
        class="flex justify-between gap-3 text-stone-600 dark:text-stone-400"
      >
        <span>{{ $t('booking.serviceFee') }} ({{ PLATFORM_FEE_PERCENT }}%)</span>
        <span class="shrink-0 tabular-nums">{{ formatPrice(pricing.serviceFee) }}</span>
      </div>

      <div
        v-if="pricing && pricing.transferPrice > 0"
        class="flex justify-between gap-3"
      >
        <span>{{ $t('booking.transfer') }}</span>
        <span class="shrink-0 tabular-nums">{{ formatPrice(pricing.transferPrice) }}</span>
      </div>

      <p
        v-else-if="pricing?.transferOnRequest"
        class="text-xs text-stone-500 dark:text-stone-400"
      >
        {{ $t('booking.transferOnRequestNote') }}
      </p>

      <div
        v-if="pricing && appliedGiftCredit > 0"
        class="flex justify-between gap-3 text-brand-800 dark:text-brand-300"
      >
        <span>{{ $t('booking.giftCertificateApplied') }}</span>
        <span class="shrink-0 tabular-nums">−{{ formatPrice(appliedGiftCredit) }}</span>
      </div>

      <div
        v-if="pricing && bonusToApply > 0"
        class="flex justify-between gap-3 text-brand-800 dark:text-brand-300"
      >
        <span>{{ $t('booking.bonusApplied') }}</span>
        <span class="shrink-0 tabular-nums">−{{ formatPrice(bonusToApply) }}</span>
      </div>

      <div
        v-if="pricing"
        class="flex justify-between gap-3 border-t border-stone-200 pt-2 font-semibold text-stone-900 dark:border-stone-700 dark:text-stone-50"
      >
        <span>{{ showCashDueLabel ? $t('booking.cashDue') : $t('booking.total') }}</span>
        <span class="shrink-0 tabular-nums">{{ formatPrice(cashDue ?? pricing.total) }}</span>
      </div>

      <p class="text-xs text-stone-500 dark:text-stone-400">
        {{ $t('booking.priceIncludesNote') }}
      </p>
    </div>

    <div
      v-if="showGiftCertificate && nights > 0"
      class="space-y-2 rounded-xl border border-stone-200 p-3 dark:border-stone-700"
      :class="hasAppliedGift ? 'border-brand-400 bg-brand-50/60 dark:border-brand-600 dark:bg-brand-950/30' : ''"
    >
      <p class="text-xs text-stone-600 dark:text-stone-400">
        {{ $t('booking.giftCertificateHint') }}
      </p>
      <div class="flex gap-2">
        <div class="min-w-0 flex-1">
          <FormInput
            v-model="giftCodeDraft"
            :label="$t('booking.giftCertificateCode')"
            autocomplete="off"
            test-id="booking-gift-certificate-code-input"
            @keyup.enter="applyGiftCertificate()"
          />
        </div>
        <UiButton
          v-if="!hasAppliedGift"
          variant="outline"
          size="sm"
          class="mt-6 shrink-0"
          :loading="giftCertLoading"
          :disabled="giftCodeDraft.trim().length < 4"
          data-testid="booking-gift-certificate-apply"
          @click="applyGiftCertificate()"
        >
          {{ $t('booking.giftCertificateApply') }}
        </UiButton>
        <UiButton
          v-else
          variant="ghost"
          size="sm"
          class="mt-6 shrink-0"
          data-testid="booking-gift-certificate-clear"
          @click="clearGiftCertificate()"
        >
          {{ $t('booking.giftCertificateClear') }}
        </UiButton>
      </div>
      <p
        v-if="giftCertError"
        class="text-xs text-red-600 dark:text-red-400"
      >
        {{ giftCertError }}
      </p>
    </div>

    <div
      v-if="showBonusOption"
      class="space-y-2 rounded-xl border border-brand-200/80 bg-brand-50/50 p-3 dark:border-brand-800 dark:bg-brand-950/30"
    >
      <p class="text-xs text-brand-900 dark:text-brand-200">
        {{ $t('booking.bonusBalance', { amount: formatPrice(bonusBalance) }) }}
      </p>
      <label class="flex cursor-pointer items-start gap-2.5">
        <input
          v-model="useBonus"
          type="checkbox"
          class="mt-0.5 size-4 shrink-0 rounded border-stone-300 text-brand-700 focus:ring-brand-500 dark:border-stone-600"
          data-testid="booking-use-bonus"
        >
        <span class="text-sm text-stone-800 dark:text-stone-200">
          <span class="font-medium">{{ $t('booking.bonusApply') }}</span>
          <span class="mt-0.5 block text-xs text-stone-600 dark:text-stone-400">
            {{ $t('booking.bonusMaxHint', { amount: formatPrice(maxBonus), percent: BONUS_MAX_BOOKING_PERCENT }) }}
          </span>
        </span>
      </label>
    </div>

    <label
      v-if="showTransferOption"
      class="flex cursor-pointer items-start gap-2.5 rounded-xl border border-stone-200 p-3 dark:border-stone-700"
      :class="includeTransfer ? 'border-brand-400 bg-brand-50/60 dark:border-brand-600 dark:bg-brand-950/30' : ''"
    >
      <input
        type="checkbox"
        class="mt-0.5 size-4 shrink-0 rounded border-stone-300 text-brand-700 focus:ring-brand-500 dark:border-stone-600"
        :checked="includeTransfer"
        @change="emit('update:includeTransfer', ($event.target as HTMLInputElement).checked)"
      >
      <span class="text-sm text-stone-700 dark:text-stone-300">
        <span class="font-medium text-stone-900 dark:text-stone-100">{{ $t('booking.transfer') }}</span>
        <span
          v-if="transferPriceOnRequest"
          class="mt-0.5 block text-xs text-stone-500 dark:text-stone-400"
        >
          {{ $t('booking.transferOnRequestHint') }}
        </span>
        <span
          v-else-if="transferPrice"
          class="mt-0.5 block text-xs text-stone-500 dark:text-stone-400"
        >
          + {{ formatPrice(transferPrice) }}
        </span>
      </span>
    </label>

    <div class="space-y-1.5">
      <FormNumberStepper
        :model-value="String(guests)"
        :label="$t('booking.guests')"
        :min="1"
        :max="maxGuests"
        variant="plain"
        @update:model-value="emit('update:guests', Number($event))"
      />
      <p
        v-if="extraGuestsHint"
        class="text-xs text-stone-500 dark:text-stone-400"
      >
        {{ extraGuestsHint }}
      </p>
    </div>

    <UiButton
      class="w-full"
      :disabled="!canBook"
      :loading="loading"
      @click="emit('book')"
    >
      {{ $t('booking.book') }}
    </UiButton>
  </div>
</template>
