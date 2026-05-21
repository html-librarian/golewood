<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth', pageTransition: false })

const { t, locale } = usePageI18n({ ru, en })
const route = useRoute()
const localePath = useLocalePath()
const { fetchPurchase } = useGiftCertificates()

const purchaseId = computed(() => String(route.params.id))
const paying = ref(false)
const payError = ref('')

const syncOnLoad = computed(() => route.query.return === '1')

const { data: purchase, pending, refresh } = await useAsyncData(
  () => `gift-purchase-pay-${purchaseId.value}-${syncOnLoad.value}`,
  () => fetchPurchase(purchaseId.value, syncOnLoad.value),
)

const isPaid = computed(() => purchase.value?.status === 'paid' || purchase.value?.status === 'redeemed')

const formatDate = (iso: string | null) => {
  if (!iso) {
    return '—'
  }

  return new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const handlePay = async () => {
  const url = purchase.value?.confirmationUrl

  if (!url) {
    payError.value = t('paymentFailed')
    return
  }

  paying.value = true
  payError.value = ''

  try {
    await navigateTo(url, { external: true })
  } catch {
    payError.value = t('paymentFailed')
  } finally {
    paying.value = false
  }
}

watch(() => route.query.return, async () => {
  if (route.query.return === '1') {
    await refresh()
  }
})
</script>

<template>
  <div class="page-container max-w-lg space-y-6 pb-16">
    <h1 class="section-title">
      {{ t('title') }}
    </h1>

    <UiSkeleton
      v-if="pending"
      class="h-40 w-full"
    />

    <UiEmpty
      v-else-if="!purchase"
      icon="ph:gift-duotone"
      :title="t('notFound')"
    />

    <template v-else>
      <article class="surface-card space-y-3 p-5">
        <h2 class="font-semibold text-stone-900 dark:text-stone-100">
          {{ purchase.listingTitle }}
        </h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{ purchase.listingCity }}
        </p>
        <dl class="text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-stone-600 dark:text-stone-400">
              {{ t('total') }}
            </dt>
            <dd class="font-semibold tabular-nums text-stone-900 dark:text-stone-100">
              {{ formatPrice(purchase.totalPrice) }}
            </dd>
          </div>
        </dl>
      </article>

      <p
        v-if="isPaid"
        class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
      >
        {{ t('success') }}
      </p>

      <article
        v-if="isPaid && purchase.code"
        class="surface-card space-y-2 p-5"
      >
        <p class="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {{ t('codeLabel') }}
        </p>
        <p class="font-mono text-2xl font-bold tracking-wider text-brand-800 dark:text-brand-200">
          {{ purchase.code }}
        </p>
        <p
          v-if="purchase.expiresAt"
          class="text-sm text-stone-600 dark:text-stone-400"
        >
          {{ t('expiresLabel') }}: {{ formatDate(purchase.expiresAt) }}
        </p>
      </article>

      <template v-else-if="purchase.status === 'pending'">
        <p class="text-sm text-stone-600 dark:text-stone-400">
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
        :to="localePath('/account/gift-certificates')"
        class="inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        {{ t('backToAccount') }}
      </NuxtLink>
    </template>
  </div>
</template>
