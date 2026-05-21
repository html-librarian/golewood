<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { fetchDashboard } = useAdmin()

const { data: dashboard, pending } = await useAsyncData('admin-dashboard', () => fetchDashboard())

const queueCards = computed(() => {
  const q = dashboard.value?.queue
  if (!q) {
    return []
  }

  return [
    {
      label: t('statModeration'),
      value: q.listingsModeration,
      to: '/admin/listings',
      icon: 'ph:house-line-duotone',
      accent: q.listingsModeration > 0,
    },
    {
      label: t('statClaims'),
      value: q.claimsPending,
      to: '/admin/listings',
      icon: 'ph:identification-card-duotone',
      accent: q.claimsPending > 0,
    },
    {
      label: t('statReviews'),
      value: q.reviewsPending,
      to: '/admin/listings',
      icon: 'ph:star-duotone',
      accent: q.reviewsPending > 0,
    },
    {
      label: t('statReports'),
      value: q.reportsOpen,
      to: '/admin/reports',
      icon: 'ph:flag-duotone',
      accent: q.reportsOpen > 0,
    },
    {
      label: t('statUsers'),
      value: q.users,
      to: '/admin/users',
      icon: 'ph:users-duotone',
      accent: false,
    },
  ]
})

const adminRevenueSeries = computed(() => {
  const charts = dashboard.value?.charts

  if (!charts) {
    return []
  }

  return [
    {
      label: t('chartRevenueCommission'),
      color: 'fill-brand-600',
      points: charts.revenueCommissionByDay,
    },
    {
      label: t('chartRevenuePromo'),
      color: 'fill-accent-500',
      points: charts.revenuePromoByDay,
    },
    {
      label: t('chartRevenueGift'),
      color: 'fill-emerald-500',
      points: charts.revenueGiftCertificatesByDay,
    },
  ]
})

const platformCards = computed(() => {
  const p = dashboard.value?.platform
  if (!p) {
    return []
  }

  return [
    { label: t('bookingsPaid'), value: p.bookingsPaid, icon: 'ph:calendar-check-duotone' },
    { label: t('bookingsLast30'), value: p.bookingsLast30Days, icon: 'ph:chart-line-up-duotone' },
    { label: t('bookingsTotal'), value: p.bookingsTotal, icon: 'ph:calendar-blank-duotone' },
    { label: t('listingsPublished'), value: p.listingsPublished, icon: 'ph:map-pin-duotone' },
    { label: t('hosts'), value: p.hosts, icon: 'ph:user-circle-duotone' },
    { label: t('guests'), value: p.guests, icon: 'ph:users-three-duotone' },
  ]
})
</script>

<template>
  <div class="page-container max-w-6xl space-y-10 pb-16">
    <header class="space-y-1">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="section-subtitle">
        {{ t('subtitle') }}
      </p>
    </header>

    <section
      v-if="pending"
      class="space-y-6"
    >
      <UiSkeleton class="h-32 w-full" />
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UiSkeleton
          v-for="n in 3"
          :key="n"
          variant="card"
        />
      </div>
    </section>

    <template v-else-if="dashboard">
      <section class="space-y-4">
        <div>
          <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
            {{ t('revenueTitle') }}
          </h2>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {{ t('revenueSubtitle') }}
          </p>
        </div>

        <article class="surface-card border-brand-200/60 bg-brand-50/40 p-5 dark:border-brand-800/50 dark:bg-brand-950/30">
          <p class="text-sm font-medium text-stone-600 dark:text-stone-400">
            {{ t('totalNet') }}
          </p>
          <div class="mt-2 grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ t('allTime') }}
              </p>
              <p class="font-display text-3xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
                {{ formatPrice(dashboard.revenue.totalNet.allTimeRub) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ t('last30Days') }}
              </p>
              <p class="font-display text-3xl font-semibold tabular-nums text-brand-800 dark:text-brand-200">
                {{ formatPrice(dashboard.revenue.totalNet.last30DaysRub) }}
              </p>
            </div>
          </div>
        </article>

        <div class="grid gap-4 lg:grid-cols-3">
          <AdminMoneyMetric
            :label="t('bookingCommission')"
            :period="dashboard.revenue.bookingCommission"
            :all-time-label="t('allTime')"
            :last30-label="t('last30Days')"
          />
          <AdminMoneyMetric
            :label="t('promoPointsSales')"
            :period="dashboard.revenue.promoPointsSales"
            :all-time-label="t('allTime')"
            :last30-label="t('last30Days')"
          />
          <AdminMoneyMetric
            :label="t('giftCertificates')"
            :period="dashboard.revenue.giftCertificates"
            :all-time-label="t('allTime')"
            :last30-label="t('last30Days')"
          />
        </div>
      </section>

      <section class="space-y-4">
        <div>
          <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
            {{ t('chartsTitle') }}
          </h2>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {{ t('chartsSubtitle') }}
          </p>
        </div>
        <div class="flex flex-col gap-6">
          <UiChartArea
            :title="t('chartBookingsTitle')"
            :subtitle="t('chartBookingsSubtitle')"
            :points="dashboard.charts.bookingsByDay"
            value-format="count"
            :empty-label="t('chartEmpty')"
          />
          <UiChartStackedBar
            :title="t('chartRevenueTitle')"
            :subtitle="t('chartRevenueSubtitle')"
            :series="adminRevenueSeries"
            value-format="price"
            :empty-label="t('chartEmpty')"
          />
        </div>
      </section>

      <section class="space-y-4">
        <div>
          <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
            {{ t('platformTitle') }}
          </h2>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {{ t('platformSubtitle') }}
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AdminKpiCard
            v-for="card in platformCards"
            :key="card.label"
            :label="card.label"
            :value="card.value"
            :icon="card.icon"
          />
        </div>
      </section>

      <section class="space-y-4">
        <div>
          <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
            {{ t('queueTitle') }}
          </h2>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {{ t('queueSubtitle') }}
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <AdminKpiCard
            v-for="card in queueCards"
            :key="card.label"
            :label="card.label"
            :value="card.value"
            :to="card.to"
            :icon="card.icon"
            :accent="card.accent"
          />
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="surface-card p-5">
          <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
            {{ t('quickLinksTitle') }}
          </h2>
          <ul class="mt-4 space-y-2">
            <li>
              <NuxtLink
                :to="localePath('/admin/listings')"
                class="flex flex-col rounded-lg px-3 py-2 transition hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <span class="font-medium text-stone-900 dark:text-stone-100">{{ t('listingsLink') }}</span>
                <span class="text-sm text-stone-600 dark:text-stone-400">{{ t('listingsDesc') }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath('/admin/users')"
                class="flex flex-col rounded-lg px-3 py-2 transition hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <span class="font-medium text-stone-900 dark:text-stone-100">{{ t('usersLink') }}</span>
                <span class="text-sm text-stone-600 dark:text-stone-400">{{ t('usersDesc') }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath('/admin/reports')"
                class="flex flex-col rounded-lg px-3 py-2 transition hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <span class="font-medium text-stone-900 dark:text-stone-100">{{ t('reportsLink') }}</span>
                <span class="text-sm text-stone-600 dark:text-stone-400">{{ t('reportsDesc') }}</span>
              </NuxtLink>
            </li>
          </ul>
        </article>

        <article class="surface-card border-dashed border-stone-300 p-5 dark:border-stone-700">
          <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
            {{ t('roadmapTitle') }}
          </h2>
          <p class="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {{ t('roadmapHint') }}
          </p>
        </article>
      </section>
    </template>
  </div>
</template>
