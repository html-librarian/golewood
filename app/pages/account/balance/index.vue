<script setup lang="ts">
import { BONUS_TRANSACTION_LABELS } from '#shared/types/bonus'
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ layout: 'account', middleware: 'auth', pageTransition: false })

const { t, locale } = usePageI18n({ ru, en })
const { fetchBonusAccount } = useBonus()

const { data: account, pending } = await useAsyncData('account-bonus', () => fetchBonusAccount())

const conditionsBody = computed(() => {
  if (!account.value) {
    return ''
  }

  return t('conditionsBody', {
    maxPercent: account.value.rules.maxBookingPercent,
    minCash: account.value.rules.minCashPayment,
    reviewPercent: account.value.rules.reviewRewardPercent,
    reviewMax: account.value.rules.reviewRewardMax,
  })
})

const formatSignedAmount = (amount: number) => {
  const formatted = formatPrice(Math.abs(amount))
  return amount > 0 ? `+${formatted}` : `-${formatted}`
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

    <section
      v-if="pending"
      class="surface-card space-y-3 p-5"
    >
      <UiSkeleton variant="title" class="w-1/3" />
      <UiSkeleton class="h-10 w-40" />
    </section>

    <template v-else-if="account">
      <section class="surface-card space-y-2 p-5">
        <p class="text-sm text-stone-500 dark:text-stone-400">
          {{ t('balanceLabel') }}
        </p>
        <p class="font-display text-4xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
          {{ formatPrice(account.balance) }}
        </p>
      </section>

      <AccountBonusFaq
        :how-to-title="t('howToGetTitle')"
        :how-to-body="t('howToGetBody')"
        :conditions-title="t('conditionsTitle')"
        :conditions-body="conditionsBody"
      />

      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">
          {{ t('history') }}
        </h2>

        <p
          v-if="!account.transactions.length"
          class="text-sm text-stone-600 dark:text-stone-400"
        >
          {{ t('historyEmpty') }}
        </p>

        <ul
          v-else
          class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
        >
          <li
            v-for="item in account.transactions"
            :key="item.id"
            class="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">
                {{ BONUS_TRANSACTION_LABELS[item.type][locale as 'ru' | 'en'] }}
              </p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ new Date(item.createdAt).toLocaleString(locale) }}
              </p>
            </div>
            <p
              class="shrink-0 text-sm font-semibold tabular-nums"
              :class="item.amount > 0 ? 'text-brand-700 dark:text-brand-400' : 'text-stone-700 dark:text-stone-300'"
            >
              {{ formatSignedAmount(item.amount) }}
            </p>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
