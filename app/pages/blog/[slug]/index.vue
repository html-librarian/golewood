<script setup lang="ts">
import type { ListingCard, ListingDetail } from '#shared/types/listing'
import { sanitizeHtml } from '#shared/utils/sanitize-html'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t, locale } = usePageI18n({ ru, en })
const route = useRoute()
const localePath = useLocalePath()
const { fetchPostBySlug } = useBlog()
const { fetchPublishedById } = useListings()

const slug = computed(() => String(route.params.slug))

const detailToCard = (detail: ListingDetail): ListingCard => ({
  ...detail,
  coverPhoto: detail.photos.find(photo => photo.mediaType === 'photo') ?? detail.photos[0] ?? null,
})

const { data: post, error } = await useAsyncData(
  () => `blog-post-${slug.value}`,
  () => fetchPostBySlug(slug.value),
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const { data: relatedListing } = await useAsyncData(
  () => `blog-post-listing-${slug.value}-${post.value?.listingId ?? 'none'}`,
  async () => {
    const listingId = post.value?.listingId

    if (!listingId) {
      return null
    }

    try {
      return detailToCard(await fetchPublishedById(listingId))
    } catch {
      return null
    }
  },
  { watch: [() => post.value?.listingId] },
)

const title = computed(() => {
  if (!post.value) {
    return ''
  }
  return locale.value === 'en' ? post.value.titleEn : post.value.titleRu
})

const bodyRaw = computed(() => {
  if (!post.value) {
    return ''
  }
  return locale.value === 'en' ? post.value.bodyEn : post.value.bodyRu
})

const bodyContent = computed(() => {
  const raw = bodyRaw.value

  if (!raw) {
    return { kind: 'empty' as const }
  }

  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    return { kind: 'plain' as const, text: raw }
  }

  return { kind: 'html' as const, html: sanitizeHtml(raw) }
})

const publishedLabel = computed(() => {
  if (!post.value?.publishedAt) {
    return ''
  }
  return new Date(post.value.publishedAt).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

useSiteSeo({
  title: title.value,
  description: post.value?.excerptRu ?? '',
})
</script>

<template>
  <article
    v-if="post"
    class="page-container max-w-3xl space-y-8"
  >
    <NuxtLink
      :to="localePath('/blog')"
      class="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-400"
    >
      <Icon
        name="ph:arrow-left"
        class="size-4"
      />
      {{ $t('blog.back') }}
    </NuxtLink>

    <header class="space-y-3">
      <p
        v-if="publishedLabel"
        class="text-sm text-stone-500 dark:text-stone-400"
      >
        {{ t('published') }} · {{ publishedLabel }}
      </p>
      <h1 class="font-display text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        {{ title }}
      </h1>
      <p
        v-if="post.listingTitle"
        class="text-sm text-stone-600 dark:text-stone-400"
      >
        {{ post.listingCity }} · {{ post.listingTitle }}
      </p>
    </header>

    <div
      v-if="post.coverImageUrl"
      class="overflow-hidden rounded-2xl"
    >
      <img
        :src="post.coverImageUrl"
        :alt="title"
        class="w-full object-cover"
      >
    </div>

    <UiSafeHtml
      v-if="bodyContent.kind === 'html'"
      class="prose prose-stone max-w-none dark:prose-invert"
      :html="bodyContent.html"
    />
    <div
      v-else-if="bodyContent.kind === 'plain'"
      class="prose prose-stone max-w-none whitespace-pre-wrap dark:prose-invert"
    >
      {{ bodyContent.text }}
    </div>

    <section
      v-if="relatedListing"
      class="space-y-3"
    >
      <p class="text-sm font-medium text-stone-700 dark:text-stone-300">
        {{ $t('blog.relatedListing') }}
      </p>
      <div class="max-w-sm">
        <ListingCard :listing="relatedListing" />
      </div>
    </section>
  </article>
</template>
