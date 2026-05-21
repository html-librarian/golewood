<script setup lang="ts">
import type { GiftCertificatePurchaseStatus } from '#shared/types/gift-certificate'
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ layout: 'account', middleware: 'auth', pageTransition: false })

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { fetchMyPurchases } = useGiftCertificates()

const { data: purchases, pending } = await useAsyncData('account-gift-purchases', () => fetchMyPurchases())

const statusLabel = (status: GiftCertificatePurchaseStatus) => {
  const map = {
    pending: t('statusPending'),
    paid: t('statusPaid'),
    redeemed: t('statusRedeemed'),
    cancelled: t('statusCancelled'),
  } as const

  return map[status]
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-8">
    <header class="space-y-1">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </header>

    <UiSkeleton
      v-if="pending"
      class="h-32 w-full"
    />

    <UiEmpty
      v-else-if="!purchases?.length"
      icon="ph:gift-duotone"
      :title="t('empty')"
    />

    <ul
      v-else
      class="space-y-4"
    >
      <li
        v-for="purchase in purchases"
        :key="purchase.id"
        class="surface-card space-y-3 p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <p class="font-semibold text-stone-900 dark:text-stone-100">
            {{ formatPrice(purchase.totalPrice) }}
          </p>
          <span class="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            {{ statusLabel(purchase.status) }}
          </span>
        </div>
        <p
          v-if="purchase.code"
          class="font-mono text-lg font-bold tracking-wide text-brand-800 dark:text-brand-200"
        >
          {{ t('code') }}: {{ purchase.code }}
        </p>
        <NuxtLink
          v-if="purchase.status === 'pending'"
          :to="localePath(`/gift-certificates/purchases/${purchase.id}/pay`)"
          class="inline-flex text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
        >
          {{ t('pay') }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
