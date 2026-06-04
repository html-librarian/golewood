<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t } = usePageI18n({ ru, en })
const { t: $t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { user } = useAuth()
const { fetchAuthor } = useBlog()

const authorId = computed(() => String(route.params.id))

const { data, error } = await useAsyncData(
  () => `blog-author-${authorId.value}`,
  () => fetchAuthor(authorId.value),
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: t('notFound') })
}

const author = computed(() => data.value?.author)
const posts = computed(() => data.value?.posts ?? [])

const authorName = computed(() =>
  author.value?.name?.trim() || $t('blog.anonymousAuthor'),
)

const isSelf = computed(() => Boolean(user.value?.id && author.value?.id === user.value.id))

useSiteSeo({
  title: authorName.value,
  description: t('posts'),
})
</script>

<template>
  <div
    v-if="author"
    class="page-container space-y-8"
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

    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-2">
        <h1 class="section-title">
          {{ authorName }}
        </h1>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{ t('postsCount', { count: author.postCount }) }}
          ·
          {{ t('followers', { count: author.followerCount }) }}
        </p>
      </div>

      <BlogFollowButton
        v-if="!isSelf"
        :author-id="author.id"
        :initial-following="Boolean(author.isFollowing)"
      />
    </header>

    <UiEmpty
      v-if="!posts.length"
      icon="ph:article-duotone"
      :title="t('empty')"
    />

    <div
      v-else
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="blog-author-posts"
    >
      <BlogCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
      />
    </div>
  </div>
</template>
