<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  middleware: 'auth',
})

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { fetchFavorites, removeFavorite } = useFavorites()

const removingId = ref<string | null>(null)

const { data: favorites, refresh, pending } = await useAsyncData('favorites', () => fetchFavorites())

const handleRemove = async (listingId: string) => {
  removingId.value = listingId

  try {
    await removeFavorite(listingId)
    await refresh()
  } finally {
    removingId.value = null
  }
}
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="section-subtitle mt-2">
        {{ t('subtitle') }}
      </p>
    </div>

    <div
      v-if="pending"
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="surface-card space-y-3 p-4"
      >
        <UiSkeleton variant="card" />
        <UiSkeleton variant="title" />
        <UiSkeleton class="w-2/3" />
      </div>
    </div>

    <UiEmpty
      v-else-if="!favorites?.length"
      icon="ph:heart-duotone"
      :title="t('empty')"
      :description="t('emptyDescription')"
    >
      <NuxtLink :to="localePath('/search')">
        <UiButton>{{ t('explore') }}</UiButton>
      </NuxtLink>
    </UiEmpty>

    <div
      v-else
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
    >
      <div
        v-for="listing in favorites"
        :key="listing.id"
        class="space-y-2"
      >
        <ListingCard :listing="listing" />
        <button
          type="button"
          class="px-1 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400"
          :disabled="removingId === listing.id"
          @click="handleRemove(listing.id)"
        >
          {{ t('remove') }}
        </button>
      </div>
    </div>
  </div>
</template>
