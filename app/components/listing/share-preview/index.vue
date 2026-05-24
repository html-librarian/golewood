<script setup lang="ts">
import type { ListingSharePreviewProps } from './types'

const props = withDefaults(defineProps<ListingSharePreviewProps>(), {
  imageUrl: null,
  siteHost: 'golewood.ru',
})

const { t } = useI18n()

const previewTitle = computed(() => props.title.trim() || t('listingSharePreview.titlePlaceholder'))
const previewDescription = computed(() => props.description.trim() || t('listingSharePreview.descriptionPlaceholder'))
</script>

<template>
  <div
    class="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900/60"
    data-testid="listing-share-preview"
  >
    <p class="mb-3 text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
      {{ t('listingSharePreview.label') }}
    </p>

    <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <div class="relative aspect-16/10 bg-stone-200 dark:bg-stone-800">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          alt=""
          class="size-full object-cover"
        >
        <div
          v-else
          class="flex size-full items-center justify-center bg-linear-to-br from-brand-700 to-teal-800"
        >
          <Icon
            name="ph:tree-evergreen-duotone"
            class="size-12 text-white/80"
          />
        </div>
      </div>
      <div class="space-y-1 p-3">
        <p class="line-clamp-2 text-sm font-semibold text-stone-900 dark:text-stone-50">
          {{ previewTitle }}
        </p>
        <p class="line-clamp-2 text-xs text-stone-600 dark:text-stone-400">
          {{ previewDescription }}
        </p>
        <p class="text-xs text-stone-400 dark:text-stone-500">
          {{ siteHost }}
        </p>
      </div>
    </div>

    <p class="mt-2 text-xs text-stone-500 dark:text-stone-400">
      {{ t('listingSharePreview.hint') }}
    </p>
  </div>
</template>
