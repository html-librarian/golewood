<script setup lang="ts">
import type { BlogSearchQuery } from '~/composables/useBlog'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const route = useRoute()
const { isAuthenticated } = useAuth()
const { fetchPosts, fetchPopularAuthors } = useBlog()

const pageSize = 24

const parseFiltersFromRoute = (): BlogSearchQuery => {
  const query = route.query

  return {
    authorId: typeof query.authorId === 'string' ? query.authorId : undefined,
    listingId: typeof query.listingId === 'string' ? query.listingId : undefined,
    city: typeof query.city === 'string' ? query.city : undefined,
    q: typeof query.q === 'string' ? query.q : undefined,
    authorQ: typeof query.authorQ === 'string' ? query.authorQ : undefined,
    following: query.following === '1' || query.following === 'true',
    page: typeof query.page === 'string' ? Math.max(1, Number(query.page) || 1) : 1,
    pageSize,
  }
}

const buildRouteQuery = (filters: BlogSearchQuery) => {
  const query: Record<string, string> = {}

  if (filters.authorId) {
    query.authorId = filters.authorId
  }

  if (filters.authorQ) {
    query.authorQ = filters.authorQ
  }

  if (filters.listingId) {
    query.listingId = filters.listingId
  }

  if (filters.city) {
    query.city = filters.city
  }

  if (filters.q) {
    query.q = filters.q
  }

  if (filters.following) {
    query.following = '1'
  }

  if (filters.page && filters.page > 1) {
    query.page = String(filters.page)
  }

  return query
}

const filters = ref(parseFiltersFromRoute())

watch(() => route.query, () => {
  filters.value = parseFiltersFromRoute()
})

const filtersKey = computed(() => JSON.stringify(parseFiltersFromRoute()))

const { data: result, pending } = await useAsyncData(
  () => `blog-posts-${filtersKey.value}`,
  () => fetchPosts(parseFiltersFromRoute()),
  { watch: [filtersKey] },
)

const { data: popularAuthors } = await useAsyncData('blog-popular-authors', () => fetchPopularAuthors(6))

const posts = computed(() => result.value?.items ?? [])
const total = computed(() => result.value?.total ?? 0)
const currentPage = computed(() => parseFiltersFromRoute().page ?? 1)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const applyFilters = async () => {
  await navigateTo({
    path: localePath('/blog'),
    query: buildRouteQuery(filters.value),
  })
}

const goToPage = async (page: number) => {
  filters.value = { ...filters.value, page }
  await applyFilters()
}

useSiteSeo({
  title: t('title'),
  description: t('subtitle'),
})
</script>

<template>
  <div class="page-container space-y-8">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="max-w-2xl space-y-2">
        <p class="editorial-kicker editorial-kicker-leaf">
          {{ t('kicker') }}
        </p>
        <h1 class="section-title section-title-accent">
          {{ t('title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('subtitle') }}
        </p>
      </div>

      <div
        v-if="isAuthenticated"
        class="flex flex-wrap gap-2"
      >
        <NuxtLink :to="localePath('/blog/my')">
          <UiButton
            variant="outline"
            size="sm"
          >
            {{ $t('blog.myPosts') }}
          </UiButton>
        </NuxtLink>
        <NuxtLink :to="localePath('/blog/create')">
          <UiButton size="sm">
            {{ $t('blog.writePost') }}
          </UiButton>
        </NuxtLink>
      </div>
    </header>

    <BlogFilters
      v-model="filters"
      @submit="applyFilters()"
    />

    <div
      v-if="pending"
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="surface-card space-y-3 overflow-hidden"
      >
        <UiSkeleton
          variant="card"
          class="aspect-video rounded-none"
        />
        <div class="space-y-2 p-4">
          <UiSkeleton variant="title" />
          <UiSkeleton class="w-full" />
          <UiSkeleton class="w-2/3" />
        </div>
      </div>
    </div>

    <UiEmpty
      v-else-if="!posts.length"
      icon="ph:article-duotone"
      :title="t('empty')"
      :description="isAuthenticated ? t('emptyAuthHint') : undefined"
    >
      <NuxtLink
        v-if="isAuthenticated"
        :to="localePath('/blog/create')"
      >
        <UiButton>{{ $t('blog.writePost') }}</UiButton>
      </NuxtLink>
    </UiEmpty>

    <template v-else>
      <div
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        data-testid="blog-post-grid"
      >
        <BlogCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
        />
      </div>

      <nav
        v-if="totalPages > 1"
        class="flex flex-wrap items-center justify-between gap-3"
        :aria-label="t('paginationAria')"
      >
        <p class="legal-meta">
          {{ t('pageOf', { page: currentPage, total: totalPages }) }}
        </p>
        <div class="flex gap-2">
          <UiButton
            type="button"
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1 || pending"
            @click="goToPage(currentPage - 1)"
          >
            {{ t('prevPage') }}
          </UiButton>
          <UiButton
            type="button"
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages || pending"
            @click="goToPage(currentPage + 1)"
          >
            {{ t('nextPage') }}
          </UiButton>
        </div>
      </nav>
    </template>

    <section
      v-if="popularAuthors?.length"
      class="space-y-4"
      data-testid="blog-popular-authors"
    >
      <h2 class="section-title-sm section-title-accent">
        {{ t('popularAuthors') }}
      </h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BlogAuthorCard
          v-for="author in popularAuthors"
          :key="author.id"
          :author="author"
        />
      </div>
    </section>
  </div>
</template>
