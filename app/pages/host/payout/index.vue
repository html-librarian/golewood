<script setup lang="ts">
import { HOST_PAYOUT_STATUS_LABELS } from '#shared/types/host-payout'
import { PLATFORM_FEE_PERCENT } from '#shared/constants/platform-fee'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const { t, locale } = usePageI18n({ ru, en })

const howSteps = computed(() => (locale.value === 'en' ? en.howSteps : ru.howSteps))
const localePath = useLocalePath()
const config = useRuntimeConfig()
const isProdHost = computed(() => config.public.siteUrl?.startsWith('https://'))
const { fetchPayoutProfile, submitPayoutProfile } = useHostPayout()

const { data: profile, pending, refresh } = await useAsyncData('host-payout-profile', () => fetchPayoutProfile())

const inn = ref('')
const bankAccount = ref('')
const bik = ref('')
const submitting = ref(false)
const submitError = ref('')

watch(profile, (value) => {
  if (!value) {
    return
  }

  inn.value = value.inn ?? ''
  bankAccount.value = value.bankAccount ?? ''
  bik.value = value.bik ?? ''
}, { immediate: true })

const canEdit = computed(() => !profile.value || ['not_started', 'rejected'].includes(profile.value.status))

const handleSubmit = async () => {
  submitting.value = true
  submitError.value = ''

  try {
    await submitPayoutProfile({
      inn: inn.value.trim(),
      bankAccount: bankAccount.value.trim(),
      bik: bik.value.trim(),
    })
    await refresh()
  } catch {
    submitError.value = t('submitFailed')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-container max-w-2xl space-y-8">
    <header class="space-y-1">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </header>

    <section
      v-if="pending"
      class="surface-card p-5"
    >
      <UiSkeleton variant="title" />
      <UiSkeleton class="mt-3 h-24 w-full" />
    </section>

    <template v-else-if="profile">
      <section class="surface-card space-y-2 p-5">
        <p class="text-sm text-stone-500 dark:text-stone-400">
          {{ t('statusLabel') }}
        </p>
        <p class="font-semibold text-stone-900 dark:text-stone-50">
          {{ HOST_PAYOUT_STATUS_LABELS[profile.status][locale as 'ru' | 'en'] }}
        </p>
        <p
          v-if="profile.status === 'active'"
          class="text-sm text-emerald-700 dark:text-emerald-400"
        >
          {{ t('activeHint') }}
        </p>
        <p
          v-else-if="profile.status === 'pending'"
          class="text-sm text-amber-800 dark:text-amber-300"
        >
          {{ t('pendingHint') }}
        </p>
        <p
          v-else-if="profile.status === 'rejected'"
          class="text-sm text-red-700 dark:text-red-400"
        >
          {{ t('rejectedHint') }}
          <span v-if="profile.rejectionReason"> — {{ profile.rejectionReason }}</span>
        </p>
      </section>

      <section class="surface-card space-y-3 p-5">
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ t('howTitle') }}
        </h2>
        <ol class="list-decimal space-y-2 pl-5 text-sm text-stone-600 dark:text-stone-400">
          <li
            v-for="(step, index) in howSteps"
            :key="index"
          >
            {{ step }}
          </li>
        </ol>
        <p class="text-xs text-stone-500 dark:text-stone-400">
          {{ $t('booking.serviceFeePercent', { percent: PLATFORM_FEE_PERCENT }) }}
        </p>
        <p
          v-if="isProdHost && profile.status === 'pending'"
          class="text-xs text-amber-800 dark:text-amber-300"
        >
          {{ t('prodPendingNote') }}
        </p>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <NuxtLink
            :to="localePath('/legal/offer')"
            class="font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            {{ t('offerLink') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/host/legal/offer')"
            class="font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            {{ t('hostTermsLink') }}
          </NuxtLink>
        </div>
      </section>

      <section class="surface-card space-y-3 p-5">
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{ t('promoNote') }}
        </p>
        <NuxtLink :to="localePath('/host/promo')">
          <UiButton
            variant="secondary"
            size="sm"
          >
            {{ t('goPromo') }}
          </UiButton>
        </NuxtLink>
      </section>

      <section
        v-if="canEdit"
        class="surface-card space-y-4 p-5"
        data-testid="host-payout-form"
      >
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ t('formTitle') }}
        </h2>
        <FormInput
          v-model="inn"
          :label="t('inn')"
          inputmode="numeric"
          autocomplete="off"
        />
        <FormInput
          v-model="bankAccount"
          :label="t('bankAccount')"
          inputmode="numeric"
          autocomplete="off"
        />
        <FormInput
          v-model="bik"
          :label="t('bik')"
          inputmode="numeric"
          autocomplete="off"
        />
        <UiButton
          :loading="submitting"
          @click="handleSubmit"
        >
          {{ submitting ? t('submitting') : t('submit') }}
        </UiButton>
        <p
          v-if="submitError"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ submitError }}
        </p>
      </section>
    </template>
  </div>
</template>
