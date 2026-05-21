<script setup lang="ts">
import type { ListingNewsCardProps } from './types'

const props = defineProps<ListingNewsCardProps>()
const localePath = useLocalePath()

const dateLabel = computed(() => {
  const raw = props.item.publishedAt ?? props.item.createdAt

  return new Date(raw).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
})
</script>

<template>
  <NuxtLink
    :to="localePath(`/listings/${listingId}/news/${item.id}`)"
    class="group flex aspect-square w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-stone-800 dark:bg-stone-900"
    data-testid="listing-news-card"
  >
    <div class="relative min-h-0 flex-1 overflow-hidden bg-stone-100 dark:bg-stone-800">
      <ListingImage
        v-if="item.previewImageUrl"
        :src="item.previewImageUrl"
        :alt="item.title"
        class="size-full object-cover transition duration-500 group-hover:scale-105"
      />
      <ListingImagePlaceholder
        v-else
        class="size-full"
      />
      <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-stone-900/80 to-transparent p-3 pt-10">
        <p class="line-clamp-2 text-sm font-semibold leading-snug text-white">
          {{ item.title }}
        </p>
      </div>
    </div>
    <div class="shrink-0 space-y-1 p-3">
      <p class="text-xs text-stone-500 dark:text-stone-400">
        {{ dateLabel }}
      </p>
      <p
        v-if="listingTitle"
        class="truncate text-[10px] font-medium uppercase tracking-wide text-brand-700 dark:text-brand-400"
      >
        {{ listingTitle }}
      </p>
      <p class="line-clamp-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
        {{ item.excerpt }}
      </p>
      <div class="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
        <span class="inline-flex items-center gap-1">
          <Icon
            name="ph:thumbs-up"
            class="size-3.5"
          />
          {{ item.likesCount }}
        </span>
        <span class="inline-flex items-center gap-1">
          <Icon
            name="ph:thumbs-down"
            class="size-3.5"
          />
          {{ item.dislikesCount }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
