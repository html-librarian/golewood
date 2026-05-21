<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
})

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { isHostUser } = useHostNavEntry()
const { fetchStats } = useHost()

const { data: stats, pending } = await useAsyncData(
  'host-stats',
  () => (isHostUser.value ? fetchStats() : Promise.resolve(null)),
  { watch: [isHostUser] },
)

const statCards = computed(() => [
  {
    label: t('statPublished'),
    value: stats.value?.listingsPublished ?? 0,
    to: localePath('/host/listings'),
    icon: 'ph:check-circle-duotone',
    color: 'text-brand-600 dark:text-brand-400',
  },
  {
    label: t('statDraft'),
    value: stats.value?.listingsDraft ?? 0,
    to: localePath('/host/listings'),
    icon: 'ph:pencil-simple-duotone',
    color: 'text-stone-500',
  },
  {
    label: t('statModeration'),
    value: stats.value?.listingsModeration ?? 0,
    to: localePath('/host/listings'),
    icon: 'ph:hourglass-duotone',
    color: 'text-accent-600',
  },
  {
    label: t('statArchived'),
    value: stats.value?.listingsArchived ?? 0,
    to: localePath('/host/listings'),
    icon: 'ph:archive-duotone',
    color: 'text-stone-400',
  },
  {
    label: t('statPending'),
    value: stats.value?.bookingsPending ?? 0,
    to: localePath('/host/bookings'),
    icon: 'ph:bell-duotone',
    color: 'text-accent-600',
  },
  {
    label: t('statUpcoming'),
    value: stats.value?.bookingsUpcoming ?? 0,
    to: localePath('/host/bookings'),
    icon: 'ph:calendar-duotone',
    color: 'text-brand-600 dark:text-brand-400',
  },
])

const listingChartSegments = computed(() => {
  if (!stats.value) {
    return []
  }

  return [
    { label: t('statPublished'), value: stats.value.listingsPublished, color: 'stroke-brand-600' },
    { label: t('statDraft'), value: stats.value.listingsDraft, color: 'stroke-stone-400' },
    { label: t('statModeration'), value: stats.value.listingsModeration, color: 'stroke-accent-500' },
    { label: t('statArchived'), value: stats.value.listingsArchived, color: 'stroke-stone-300 dark:stroke-stone-600' },
  ]
})

const bookingChartSegments = computed(() => {
  if (!stats.value) {
    return []
  }

  return [
    { label: t('statPending'), value: stats.value.bookingsPending, color: 'stroke-accent-500' },
    { label: t('statUpcoming'), value: stats.value.bookingsUpcoming, color: 'stroke-brand-600' },
  ]
})

const analytics = computed(() => stats.value?.analytics)
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="section-title">
        {{ isHostUser ? t('title') : t('guestTitle') }}
      </h1>
      <p class="section-subtitle mt-2">
        {{ isHostUser ? t('subtitle') : t('guestSubtitle') }}
      </p>
    </div>

    <section
      v-if="!isHostUser"
      class="surface-card mb-10 space-y-4 p-6"
      data-testid="host-guest-onboarding"
    >
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('guestRoleNote') }}
      </p>
      <div class="flex flex-wrap gap-3">
        <NuxtLink :to="localePath('/host/listings/create')">
          <UiButton>{{ t('guestCta') }}</UiButton>
        </NuxtLink>
        <NuxtLink :to="localePath('/help/become-host')">
          <UiButton variant="secondary">
            {{ t('guestHelp') }}
          </UiButton>
        </NuxtLink>
      </div>
    </section>

    <section
      v-if="isHostUser"
      class="mb-10 space-y-4"
      data-testid="host-analytics"
    >
      <div>
        <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
          {{ t('analyticsTitle') }}
        </h2>
        <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {{ t('analyticsSubtitle') }}
        </p>
      </div>

      <div
        v-if="pending"
        class="grid gap-4 lg:grid-cols-2"
      >
        <UiSkeleton class="h-40 w-full" />
        <UiSkeleton class="h-40 w-full" />
      </div>

      <template v-else-if="stats">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article class="surface-card border-brand-200/60 bg-brand-50/40 p-4 dark:border-brand-800/50 dark:bg-brand-950/30">
            <p class="text-xs font-medium text-stone-600 dark:text-stone-400">
              {{ t('earnings30') }}
            </p>
            <p class="mt-1 font-display text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
              {{ formatPrice(analytics?.earningsLast30DaysRub ?? 0) }}
            </p>
          </article>
          <article class="surface-card p-4">
            <p class="text-xs font-medium text-stone-600 dark:text-stone-400">
              {{ t('paidBookings30') }}
            </p>
            <p class="mt-1 font-display text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
              {{ analytics?.paidBookingsLast30Days ?? 0 }}
            </p>
          </article>
          <article class="surface-card p-4">
            <p class="text-xs font-medium text-stone-600 dark:text-stone-400">
              {{ t('portalBookings30') }}
            </p>
            <p class="mt-1 font-display text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
              {{ analytics?.bookingsCreatedLast30Days ?? 0 }}
            </p>
          </article>
          <article class="surface-card p-4">
            <p class="text-xs font-medium text-stone-600 dark:text-stone-400">
              {{ t('averageRating') }}
            </p>
            <p class="mt-1 font-display text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
              {{ analytics?.averageRating ?? '—' }}
            </p>
            <p class="text-xs text-stone-500 dark:text-stone-400">
              {{ analytics?.approvedReviews ?? 0 }} {{ t('reviewsCount') }}
            </p>
          </article>
        </div>

        <div class="flex flex-col gap-6">
          <UiChartArea
            :title="t('chartEarningsTitle')"
            :subtitle="t('chartEarningsSubtitle')"
            :points="stats.charts.earningsByDay"
            value-format="price"
            :empty-label="t('chartEmpty')"
          />
          <UiChartArea
            :title="t('chartBookingsTitle')"
            :subtitle="t('chartBookingsSubtitle')"
            :points="stats.charts.bookingsByDay"
            value-format="count"
            :empty-label="t('chartEmpty')"
            accent-class="text-accent-600 dark:text-accent-400"
          />
        </div>
      </template>
    </section>

    <div
      v-if="isHostUser && pending"
      class="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="surface-card space-y-3 p-5"
      >
        <UiSkeleton class="h-6 w-6 rounded-lg" />
        <UiSkeleton variant="title" class="w-1/3" />
        <UiSkeleton class="w-2/3" />
      </div>
    </div>

    <div
      v-else-if="isHostUser"
      class="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <NuxtLink
        v-for="card in statCards"
        :key="card.label"
        :to="card.to"
        class="surface-card group p-5 transition hover:shadow-(--shadow-card)"
      >
        <div class="flex items-start justify-between">
          <Icon
            :name="card.icon"
            class="size-6"
            :class="card.color"
          />
          <span class="text-3xl font-bold text-stone-900 dark:text-stone-50">
            {{ card.value }}
          </span>
        </div>
        <p class="mt-3 text-sm font-medium text-stone-600 dark:text-stone-400">
          {{ card.label }}
        </p>
      </NuxtLink>
    </div>

    <div
      v-if="isHostUser && pending"
      class="mb-10 grid gap-4 lg:grid-cols-2"
    >
      <div
        v-for="n in 2"
        :key="n"
        class="surface-card space-y-4 p-5"
      >
        <UiSkeleton variant="title" class="w-1/2" />
        <UiSkeleton class="h-28 w-full rounded-lg" />
      </div>
    </div>

    <div
      v-else-if="isHostUser"
      class="mb-10 grid gap-4 lg:grid-cols-2"
    >
      <HostStatsChart
        :title="t('listingsBreakdown')"
        :segments="listingChartSegments"
        :total-label="t('listingsTotal')"
      />
      <HostStatsChart
        :title="t('bookingsBreakdown')"
        :segments="bookingChartSegments"
        :total-label="t('bookingsTotal')"
      />
    </div>

    <div
      class="grid gap-4 sm:grid-cols-2"
      :class="isHostUser ? 'lg:grid-cols-3' : 'lg:grid-cols-2'"
    >
      <NuxtLink
        :to="localePath('/host/guide')"
        class="surface-card group p-6 transition hover:shadow-(--shadow-card)"
      >
        <Icon
          name="ph:graduation-cap-duotone"
          class="mb-3 size-8 text-brand-600 dark:text-brand-400"
        />
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ t('guideLink') }}
        </h2>
        <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {{ t('guideDesc') }}
        </p>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/host/listings')"
        class="surface-card group p-6 transition hover:shadow-(--shadow-card)"
      >
        <Icon
          name="ph:house-line-duotone"
          class="mb-3 size-8 text-brand-600 dark:text-brand-400"
        />
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ t('listingsLink') }}
        </h2>
        <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {{ t('listingsDesc') }}
        </p>
      </NuxtLink>

      <template v-if="isHostUser">
        <NuxtLink
          :to="localePath('/host/bookings')"
          class="surface-card group p-6 transition hover:shadow-(--shadow-card)"
        >
          <Icon
            name="ph:calendar-check-duotone"
            class="mb-3 size-8 text-brand-600 dark:text-brand-400"
          />
          <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
            {{ t('bookingsLink') }}
          </h2>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {{ t('bookingsDesc') }}
          </p>
        </NuxtLink>

        <NuxtLink
          :to="localePath('/host/gift-certificates')"
          class="surface-card group p-6 transition hover:shadow-(--shadow-card)"
        >
          <Icon
            name="ph:gift-duotone"
            class="mb-3 size-8 text-brand-600 dark:text-brand-400"
          />
          <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
            {{ t('giftCertificatesLink') }}
          </h2>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {{ t('giftCertificatesDesc') }}
          </p>
        </NuxtLink>

        <NuxtLink
          :to="localePath('/host/promo')"
          class="surface-card group p-6 transition hover:shadow-(--shadow-card)"
        >
          <Icon
            name="ph:megaphone-duotone"
            class="mb-3 size-8 text-brand-600 dark:text-brand-400"
          />
          <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
            {{ t('promoLink') }}
          </h2>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {{ t('promoDesc') }}
          </p>
        </NuxtLink>
      </template>
    </div>
  </div>
</template>
