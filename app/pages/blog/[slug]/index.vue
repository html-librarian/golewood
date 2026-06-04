<script setup lang="ts">
import type { ListingCard, ListingDetail } from '#shared/types/listing'
import { sanitizeHtml } from '#shared/utils/sanitize-html'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t, locale } = usePageI18n({ ru, en })
const route = useRoute()
const localePath = useLocalePath()
const { user } = useAuth()
const { fetchPostBySlug, fetchPosts } = useBlog()
const { fetchPublishedById } = useListings()
const { fetchHomePromos } = useHomePromos()

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

const { data: homePromos } = await useAsyncData('blog-sidebar-promos', () => fetchHomePromos())

const sidebarPromos = computed(() => homePromos.value ?? { featured: null, carousel: [] })

const hasSidebarPromos = computed(() =>
  Boolean(sidebarPromos.value.featured) || sidebarPromos.value.carousel.length > 0,
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

const isOwnPost = computed(() =>
  Boolean(user.value?.id && post.value?.authorId && user.value.id === post.value.authorId),
)

const { data: moreFromAuthor } = await useAsyncData(
  () => `blog-post-more-${slug.value}-${post.value?.authorId ?? 'none'}`,
  async () => {
    const authorId = post.value?.authorId

    if (!authorId) {
      return []
    }

    const result = await fetchPosts({ authorId, pageSize: 4 })
    return result.items.filter(item => item.slug !== slug.value).slice(0, 3)
  },
  { watch: [() => post.value?.authorId, slug] },
)

useSiteSeo({
  title: title.value,
  description: post.value?.excerptRu ?? '',
})
</script>

<template>
  <div
    v-if="post"
    class="page-container pb-16"
  >
    <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,1fr)_340px]">
      <article class="min-w-0 max-w-3xl space-y-8">
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

        <UiReveal>
        <header class="space-y-3">
          <p
            v-if="publishedLabel"
            class="editorial-kicker editorial-kicker-leaf"
          >
            {{ t('published') }} · {{ publishedLabel }}
          </p>
          <h1 class="article-title-accent">
            {{ title }}
          </h1>
          <div
            v-if="post.authorId || post.listingTitle || post.city"
            class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-600 dark:text-stone-400"
          >
            <div
              v-if="post.authorId"
              class="flex items-center gap-2"
            >
              <NuxtLink
                :to="localePath(`/blog/authors/${post.authorId}`)"
                class="font-medium text-brand-700 hover:underline dark:text-brand-400"
              >
                {{ post.authorName?.trim() || $t('blog.anonymousAuthor') }}
              </NuxtLink>
              <BlogFollowButton
                v-if="!isOwnPost"
                :author-id="post.authorId"
                :initial-following="Boolean(post.authorIsFollowing)"
                size="sm"
              />
            </div>
            <span v-else-if="!post.listingTitle">
              {{ $t('blog.teamReview') }}
            </span>
            <span v-if="post.city || post.listingCity || post.listingTitle">
              {{ [post.city ?? post.listingCity, post.listingTitle].filter(Boolean).join(' · ') }}
            </span>
          </div>
        </header>

        <div
          v-if="post.coverImageUrl"
          class="gallery-tile-enter overflow-hidden rounded-2xl ring-1 ring-stone-200/80 dark:ring-stone-800/80"
        >
          <img
            :src="post.coverImageUrl"
            :alt="title"
            class="aspect-video w-full object-cover"
          >
        </div>

        <UiSafeHtml
          v-if="bodyContent.kind === 'html'"
          class="prose prose-stone prose-forest max-w-none dark:prose-invert"
          :html="bodyContent.html"
        />
        <div
          v-else-if="bodyContent.kind === 'plain'"
          class="prose prose-stone prose-forest max-w-none whitespace-pre-wrap dark:prose-invert"
        >
          {{ bodyContent.text }}
        </div>
        </UiReveal>

        <section
          v-if="moreFromAuthor?.length"
          class="space-y-4"
          data-testid="blog-more-from-author"
        >
          <h2 class="section-title-sm section-title-accent">
            {{ t('moreFromAuthor') }}
          </h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <BlogCard
              v-for="item in moreFromAuthor"
              :key="item.id"
              :post="item"
            />
          </div>
        </section>

        <section
          v-if="relatedListing"
          class="space-y-3 lg:hidden"
        >
          <p class="text-sm font-medium text-stone-700 dark:text-stone-300">
            {{ $t('blog.relatedListing') }}
          </p>
          <ListingCard :listing="relatedListing" />
        </section>
      </article>

      <aside class="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <section
          v-if="relatedListing"
          class="hidden space-y-3 lg:block"
        >
          <p class="text-sm font-semibold text-stone-800 dark:text-stone-200">
            {{ $t('blog.relatedListing') }}
          </p>
          <ListingCard :listing="relatedListing" />
        </section>

        <section
          v-if="hasSidebarPromos"
          class="space-y-3"
        >
          <p class="text-sm font-semibold text-stone-800 dark:text-stone-200">
            {{ t('sidebarPromos') }}
          </p>
          <div class="space-y-4">
            <HomePromoBanner
              v-if="sidebarPromos.featured"
              :banner="sidebarPromos.featured"
              variant="featured"
            />
            <HomePromoCarousel
              v-if="sidebarPromos.carousel.length"
              :banners="sidebarPromos.carousel"
            />
          </div>
        </section>

        <NuxtLink
          :to="localePath('/spotlight')"
          class="surface-card-interactive group block space-y-2 p-4"
        >
          <span class="flex items-center gap-2">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-400/15 text-accent-700 dark:bg-accent-400/10 dark:text-accent-300"
              aria-hidden="true"
            >
              <Icon
                name="ph:camera-duotone"
                class="size-5"
              />
            </span>
            <span class="font-semibold text-stone-900 dark:text-stone-50">
              {{ $t('spotlight.link') }}
            </span>
          </span>
          <p class="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {{ t('sidebarSpotlightHint') }}
          </p>
        </NuxtLink>
      </aside>
    </div>
  </div>
</template>
