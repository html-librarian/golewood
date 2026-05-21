<script setup lang="ts">
import type { GiftCertificatePurchaseStatus } from '#shared/types/gift-certificate'
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const { fetchHostSales } = useGiftCertificates()

const { data: report, pending } = await useAsyncData('host-gift-sales', () => fetchHostSales())

const statusLabel = (status: Extract<GiftCertificatePurchaseStatus, 'paid' | 'redeemed'>) =>
  t(`status.${status}`)
</script>

<template>
  <div class="page-container max-w-4xl">
    <header class="mb-6 space-y-1">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </header>

    <div
      v-if="pending"
      class="space-y-4"
    >
      <div class="surface-card grid gap-3 p-4 sm:grid-cols-3">
        <UiSkeleton
          v-for="n in 3"
          :key="n"
          class="h-14"
        />
      </div>
      <div
        v-for="n in 3"
        :key="`row-${n}`"
        class="surface-card space-y-3 p-4"
      >
        <UiSkeleton variant="title" class="w-2/3" />
        <UiSkeleton class="w-1/2" />
      </div>
    </div>

    <template v-else-if="report">
      <div
        v-if="report.summary.soldCount > 0"
        class="mb-6 grid gap-4 sm:grid-cols-3"
      >
        <article class="surface-card p-4">
          <p class="text-xs font-medium text-stone-600 dark:text-stone-400">
            {{ t('soldCount') }}
          </p>
          <p class="mt-1 font-display text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
            {{ report.summary.soldCount }}
          </p>
        </article>
        <article class="surface-card p-4">
          <p class="text-xs font-medium text-stone-600 dark:text-stone-400">
            {{ t('yourEarnings') }}
          </p>
          <p class="mt-1 font-display text-2xl font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">
            {{ formatPrice(report.summary.hostAmountRub) }}
          </p>
        </article>
        <article class="surface-card p-4">
          <p class="text-xs font-medium text-stone-600 dark:text-stone-400">
            {{ t('platformFee') }}
          </p>
          <p class="mt-1 font-display text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
            {{ formatPrice(report.summary.platformFeeRub) }}
          </p>
        </article>
      </div>

      <UiEmpty
        v-if="!report.purchases.length"
        icon="ph:gift-duotone"
        :title="t('empty')"
      />

      <div
        v-else
        class="space-y-4"
      >
        <article
          v-for="purchase in report.purchases"
          :key="purchase.id"
          class="surface-card p-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="font-semibold text-stone-900 dark:text-stone-100">
                {{ purchase.listingTitle }}
              </h2>
              <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {{ t('soldAt') }}: {{ purchase.createdAt.slice(0, 10) }}
                <span v-if="purchase.redeemedAt">
                  · {{ t('redeemedAt') }}: {{ purchase.redeemedAt.slice(0, 10) }}
                </span>
                <span v-else-if="purchase.expiresAt">
                  · {{ t('expiresAt') }}: {{ purchase.expiresAt.slice(0, 10) }}
                </span>
              </p>
              <UiBadge
                class="mt-2"
                variant="muted"
              >
                {{ statusLabel(purchase.status) }}
              </UiBadge>
            </div>
            <div class="text-right">
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ t('guestPaid') }}
              </p>
              <p class="font-semibold text-stone-900 dark:text-stone-100">
                {{ formatPrice(purchase.totalPrice) }}
              </p>
              <dl class="mt-1 space-y-0.5 text-sm text-stone-600 dark:text-stone-400">
                <div class="flex justify-end gap-3">
                  <dt>{{ t('yourPayout') }}</dt>
                  <dd class="tabular-nums text-emerald-800 dark:text-emerald-300">
                    {{ formatPrice(purchase.hostAmount) }}
                  </dd>
                </div>
                <div class="flex justify-end gap-3">
                  <dt>{{ t('platformFee') }}</dt>
                  <dd class="tabular-nums">
                    {{ formatPrice(purchase.platformFee) }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>
