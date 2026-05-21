<script setup lang="ts">
import type { ListingNewsItem } from '#shared/types/listing-news'
import { sanitizeHtml } from '#shared/utils/sanitize-html'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t } = usePageI18n({ ru, en })
const route = useRoute()
const localePath = useLocalePath()
const { fetchNewsDetail } = useListingNews()

const listingId = computed(() => String(route.params.id))
const newsId = computed(() => String(route.params.newsId))

const { data: news, pending, error } = await useAsyncData(
  () => `listing-news-detail-${listingId.value}-${newsId.value}`,
  () => fetchNewsDetail(listingId.value, newsId.value),
)

const newsState = ref<ListingNewsItem | null>(news.value ?? null)

watch(news, (value) => {
  newsState.value = value ?? null
})

const dateLabel = computed(() => {
  if (!newsState.value) {
    return ''
  }

  const raw = newsState.value.publishedAt ?? newsState.value.createdAt

  return new Date(raw).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const bodyContent = computed(() => {
  const raw = newsState.value?.body ?? ''

  if (!raw) {
    return { kind: 'empty' as const }
  }

  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    return { kind: 'plain' as const, text: raw }
  }

  return { kind: 'html' as const, html: sanitizeHtml(raw) }
})

const onReactionsUpdated = (payload: Pick<ListingNewsItem, 'likesCount' | 'dislikesCount' | 'userReaction'>) => {
  if (!newsState.value) {
    return
  }

  newsState.value = { ...newsState.value, ...payload }
}
</script>

<template>
  <div class="page-container max-w-3xl space-y-8 pb-16">
    <NuxtLink
      :to="localePath(`/listings/${listingId}`)"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
    >
      <Icon
        name="ph:arrow-left"
        class="size-4"
      />
      {{ t('backToListing') }}
    </NuxtLink>

    <div
      v-if="pending"
      class="space-y-4"
    >
      <UiSkeleton class="aspect-video w-full rounded-2xl" />
      <UiSkeleton variant="title" />
      <UiSkeleton class="h-24 w-full" />
    </div>

    <UiEmpty
      v-else-if="error || !newsState"
      icon="ph:newspaper-duotone"
      :title="$t('common.emDash')"
    />

    <article
      v-else
      class="space-y-6"
    >
      <div
        v-if="newsState.previewImageUrl"
        class="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800"
      >
        <ListingImage
          :src="newsState.previewImageUrl"
          :alt="newsState.title"
          class="aspect-video w-full object-cover"
        />
      </div>

      <header class="space-y-2">
        <p class="text-sm text-stone-500 dark:text-stone-400">
          {{ dateLabel }}
        </p>
        <h1 class="font-display text-3xl font-semibold text-stone-900 dark:text-stone-50">
          {{ newsState.title }}
        </h1>
      </header>

      <ListingNewsReactions
        :listing-id="listingId"
        :news-id="newsState.id"
        :likes-count="newsState.likesCount"
        :dislikes-count="newsState.dislikesCount"
        :user-reaction="newsState.userReaction"
        @updated="onReactionsUpdated"
      />

      <UiSafeHtml
        v-if="bodyContent.kind === 'html'"
        class="prose prose-stone max-w-none dark:prose-invert"
        :html="bodyContent.html"
      />
      <div
        v-else-if="bodyContent.kind === 'plain'"
        class="prose prose-stone max-w-none dark:prose-invert"
      >
        <p class="whitespace-pre-wrap text-base leading-relaxed text-stone-700 dark:text-stone-300">
          {{ bodyContent.text }}
        </p>
      </div>

      <section
        v-if="newsState.media?.length"
        class="space-y-3"
      >
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ t('galleryTitle') }}
        </h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="media in newsState.media"
            :key="media.id"
            class="overflow-hidden rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900"
          >
            <iframe
              v-if="media.mediaType === 'video' && media.embedUrl"
              :src="media.embedUrl"
              class="aspect-video w-full border-0 bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              :title="newsState.title"
            />
            <video
              v-else-if="media.mediaType === 'video'"
              :src="media.url"
              class="aspect-video w-full bg-black"
              controls
              playsinline
            />
            <ListingImage
              v-else
              :src="media.url"
              :alt="newsState.title"
              class="aspect-video w-full object-cover"
            />
          </div>
        </div>
      </section>

      <NuxtLink
        v-if="newsState.showBookingButton"
        :to="localePath(`/listings/${listingId}#booking-panel`)"
        class="inline-flex"
      >
        <UiButton size="lg">
          {{ t('bookNow') }}
        </UiButton>
      </NuxtLink>
    </article>
  </div>
</template>
