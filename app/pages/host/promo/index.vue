<script setup lang="ts">
import { HOST_PROMO_TRANSACTION_LABELS } from '#shared/types/promotion'
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const { t, locale } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { fetchPromoAccount, purchasePoints } = useHostPromo()

const { data: account, pending, refresh } = await useAsyncData('host-promo-account', () => fetchPromoAccount())

const buyingSlug = ref<string | null>(null)
const buyError = ref('')

const handleBuyPackage = async (packageSlug: string) => {
  buyingSlug.value = packageSlug
  buyError.value = ''

  try {
    const result = await purchasePoints({ packageSlug })

    if (result.confirmationUrl && result.purchase.status === 'pending') {
      await navigateTo(result.confirmationUrl, { external: true })
      return
    }

    await refresh()
  } catch {
    buyError.value = t('buyFailed')
  } finally {
    buyingSlug.value = null
  }
}

const formatSignedAmount = (amount: number) => {
  const formatted = formatPrice(Math.abs(amount))
  return amount > 0 ? `+${formatted}` : `-${formatted}`
}

</script>

<template>
  <div class="page-container max-w-2xl space-y-8">
    <header class="space-y-3">
      <NuxtLink
        :to="localePath('/host')"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        <Icon
          name="ph:arrow-left"
          class="size-4"
        />
        {{ t('backToHost') }}
      </NuxtLink>
      <div class="space-y-1">
        <h1 class="section-title">
          {{ t('title') }}
        </h1>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{ t('subtitle') }}
        </p>
      </div>
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
          {{ account.balance }}
        </p>
      </section>

      <section class="surface-card space-y-3 p-5">
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ t('howToGetTitle') }}
        </h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{ t('howToGetBody') }}
        </p>
      </section>

      <section
        id="buy"
        class="surface-card space-y-4 p-5"
        data-testid="host-promo-buy"
      >
        <div class="space-y-1">
          <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
            {{ t('buyTitle') }}
          </h2>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{ t('buySubtitle') }}
          </p>
        </div>
        <ul class="space-y-3">
          <li
            v-for="pkg in account.pointPackages"
            :key="pkg.slug"
            class="rounded-xl border border-stone-200/80 p-4 dark:border-stone-700"
          >
            <p class="font-semibold text-stone-900 dark:text-stone-50">
              {{ locale === 'en' ? pkg.titleEn : pkg.titleRu }}
            </p>
            <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {{ locale === 'en' ? pkg.descriptionEn : pkg.descriptionRu }}
            </p>
            <p class="mt-2 text-sm font-medium text-brand-700 dark:text-brand-400">
              {{ pkg.points }} {{ $t('promotion.points') }}
            </p>
            <UiButton
              class="mt-3"
              :loading="buyingSlug === pkg.slug"
              data-testid="host-promo-buy-package"
              @click="handleBuyPackage(pkg.slug)"
            >
              {{
                buyingSlug === pkg.slug
                  ? t('buying')
                  : t('buyPackage', { price: formatPrice(pkg.priceRub) })
              }}
            </UiButton>
          </li>
        </ul>
        <p
          v-if="buyError"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ buyError }}
        </p>
      </section>

      <section class="surface-card space-y-4 p-5">
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ t('productsTitle') }}
        </h2>
        <ul class="space-y-3">
          <li
            v-for="product in account.products"
            :key="product.slug"
            class="rounded-xl border border-stone-200/80 p-4 dark:border-stone-700"
          >
            <p class="font-semibold text-stone-900 dark:text-stone-50">
              {{ locale === 'en' ? product.titleEn : product.titleRu }}
            </p>
            <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {{ locale === 'en' ? product.descriptionEn : product.descriptionRu }}
            </p>
            <p class="mt-2 text-sm font-medium text-brand-700 dark:text-brand-400">
              {{ product.pricePoints }} {{ $t('promotion.points') }} · {{ product.durationDays }} {{ locale === 'en' ? 'days' : 'дн.' }}
            </p>
          </li>
        </ul>
        <NuxtLink :to="localePath('/host/promo/pick')">
          <UiButton variant="secondary">
            {{ t('promoteListing') }}
          </UiButton>
        </NuxtLink>
      </section>

      <section class="surface-card space-y-4 p-5">
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ t('transactionsTitle') }}
        </h2>
        <UiEmpty
          v-if="!account.transactions.length"
          icon="ph:coins-duotone"
          :title="t('emptyTransactions')"
        />
        <ul
          v-else
          class="divide-y divide-stone-200 dark:divide-stone-800"
        >
          <li
            v-for="tx in account.transactions"
            :key="tx.id"
            class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div>
              <p class="text-sm font-medium text-stone-900 dark:text-stone-50">
                {{ HOST_PROMO_TRANSACTION_LABELS[tx.type][locale as 'ru' | 'en'] }}
              </p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ new Date(tx.createdAt).toLocaleString(locale === 'en' ? 'en-GB' : 'ru-RU') }}
              </p>
            </div>
            <p
              class="text-sm font-semibold tabular-nums"
              :class="tx.amount > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'"
            >
              {{ formatSignedAmount(tx.amount) }}
            </p>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
