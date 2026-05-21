<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t } = usePageI18n({ ru, en })
const { fetchPosts } = useBlog()

const { data: posts, pending } = await useAsyncData('blog-posts', () => fetchPosts())

useSiteSeo({
  title: t('title'),
  description: t('subtitle'),
})
</script>

<template>
  <div class="page-container space-y-10">
    <header class="max-w-2xl space-y-2">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </header>

    <p
      v-if="pending"
      class="text-sm text-stone-500 dark:text-stone-400"
    >
      {{ $t('common.loading') }}
    </p>

    <p
      v-else-if="!posts?.length"
      class="text-stone-600 dark:text-stone-400"
    >
      {{ t('empty') }}
    </p>

    <div
      v-else
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      <BlogCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
      />
    </div>
  </div>
</template>
