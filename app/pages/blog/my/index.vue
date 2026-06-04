<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth', pageTransition: false })

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { fetchMyPosts } = useBlog()

const { data: posts, pending } = await useAsyncData('blog-my-posts', () => fetchMyPosts())

useSiteSeo({ title: t('title'), description: t('subtitle') })
</script>

<template>
  <div class="page-container max-w-3xl space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <UiPageHeader
        :title="t('title')"
        :subtitle="t('subtitle')"
      />
      <NuxtLink :to="localePath('/blog/create')">
        <UiButton size="sm">{{ t('create') }}</UiButton>
      </NuxtLink>
    </div>

    <UiEmpty
      v-if="!pending && !posts?.length"
      icon="ph:article-duotone"
      :title="t('empty')"
    >
      <NuxtLink :to="localePath('/blog/create')">
        <UiButton>{{ t('create') }}</UiButton>
      </NuxtLink>
    </UiEmpty>

    <div
      v-else-if="pending"
      class="space-y-3"
    >
      <UiSkeleton
        v-for="n in 3"
        :key="n"
        class="h-16 w-full rounded-xl"
      />
    </div>

    <ul
      v-else
      class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
      data-testid="blog-my-posts"
    >
      <li
        v-for="post in posts"
        :key="post.id"
        class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
      >
        <div class="min-w-0">
          <p class="font-medium text-stone-900 dark:text-stone-50">
            {{ post.titleRu }}
          </p>
          <p class="text-xs text-stone-500 dark:text-stone-400">
            {{ post.status === 'published' ? t('published') : t('draft') }}
            <span v-if="post.city"> · {{ post.city }}</span>
          </p>
        </div>
        <div class="flex shrink-0 gap-2">
          <NuxtLink
            v-if="post.status === 'published'"
            :to="localePath(`/blog/${post.slug}`)"
            class="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            {{ t('open') }}
          </NuxtLink>
          <NuxtLink :to="localePath(`/blog/edit/${post.id}`)">
            <UiButton
              size="sm"
              variant="secondary"
            >
              {{ t('edit') }}
            </UiButton>
          </NuxtLink>
        </div>
      </li>
    </ul>
  </div>
</template>
