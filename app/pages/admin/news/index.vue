<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
  staffRoles: ['admin', 'content_manager'],
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { fetchAdminPublishedListings } = useTeamBadges()

const { data: listings, pending } = await useAsyncData(
  'admin-news-listings',
  () => fetchAdminPublishedListings(),
)
</script>

<template>
  <div class="page-container max-w-4xl">
    <h1 class="section-title mb-2">
      {{ t('title') }}
    </h1>
    <p class="mb-6 text-sm text-stone-600 dark:text-stone-400">
      {{ t('intro') }}
    </p>

    <div
      v-if="pending"
      class="space-y-3"
    >
      <UiSkeleton
        v-for="n in 4"
        :key="n"
        class="h-14 w-full"
      />
    </div>

    <UiEmpty
      v-else-if="!listings?.length"
      icon="ph:newspaper-duotone"
      :title="t('empty')"
    />

    <ul
      v-else
      class="space-y-2"
    >
      <li
        v-for="listing in listings"
        :key="listing.id"
      >
        <NuxtLink
          :to="localePath(`/admin/listings/${listing.id}/news`)"
          class="surface-card flex items-center justify-between gap-4 p-4 transition hover:border-brand-200 dark:hover:border-brand-800"
        >
          <span class="font-medium text-stone-900 dark:text-stone-100">
            {{ listing.title }}
          </span>
          <span class="text-sm font-semibold text-brand-700 dark:text-brand-300">
            {{ t('manageNews') }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
