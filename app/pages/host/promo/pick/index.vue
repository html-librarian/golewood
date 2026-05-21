<script setup lang="ts">
import { LISTING_STATUS_LABELS } from '#shared/types/listing'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const { locale } = useI18n()
const localePath = useLocalePath()
const { fetchHostListings } = useListings()

const { data: listings, pending } = await useAsyncData('host-promo-pick-listings', () => fetchHostListings())

const publishedListings = computed(() =>
  (listings.value ?? []).filter(listing => listing.status === 'published'),
)

const unpublishedListings = computed(() =>
  (listings.value ?? []).filter(listing => listing.status !== 'published' && listing.status !== 'archived'),
)
</script>

<template>
  <div class="page-container max-w-2xl space-y-8">
    <header class="space-y-3">
      <NuxtLink
        :to="localePath('/host/promo')"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        <Icon
          name="ph:arrow-left"
          class="size-4"
        />
        {{ t('backToPromo') }}
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
      class="space-y-3"
    >
      <div
        v-for="n in 2"
        :key="n"
        class="surface-card p-5"
      >
        <UiSkeleton variant="title" />
        <UiSkeleton class="mt-3 h-9 w-28" />
      </div>
    </section>

    <template v-else>
      <UiEmpty
        v-if="!publishedListings.length"
        icon="ph:megaphone-duotone"
        :title="t('emptyPublished')"
        :description="t('emptyPublishedHint')"
      >
        <NuxtLink :to="localePath('/host/listings')">
          <UiButton variant="secondary">
            {{ t('goToListings') }}
          </UiButton>
        </NuxtLink>
      </UiEmpty>

      <ul
        v-else
        class="space-y-3"
        data-testid="promo-pick-published"
      >
        <li
          v-for="listing in publishedListings"
          :key="listing.id"
          class="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0 space-y-1">
            <p class="font-semibold text-stone-900 dark:text-stone-50">
              {{ listing.title }}
            </p>
            <p class="text-sm text-stone-600 dark:text-stone-400">
              {{ listing.city }}
            </p>
          </div>
          <NuxtLink
            :to="localePath(`/host/listings/${listing.id}/promote`)"
            class="shrink-0"
          >
            <UiButton data-testid="promo-pick-button">
              {{ t('promote') }}
            </UiButton>
          </NuxtLink>
        </li>
      </ul>

      <section
        v-if="unpublishedListings.length"
        class="space-y-3"
      >
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ t('unpublishedTitle') }}
        </h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{ t('unpublishedHint') }}
        </p>
        <ul class="space-y-2">
          <li
            v-for="listing in unpublishedListings"
            :key="listing.id"
            class="rounded-xl border border-stone-200/80 px-4 py-3 dark:border-stone-700"
          >
            <p class="font-medium text-stone-900 dark:text-stone-50">
              {{ listing.title }}
            </p>
            <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {{ LISTING_STATUS_LABELS[listing.status][locale as 'ru' | 'en'] }}
            </p>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
