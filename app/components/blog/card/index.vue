<script setup lang="ts">
import type { BlogCardProps } from './types'

const props = defineProps<BlogCardProps>()

const { locale } = useI18n()
const localePath = useLocalePath()

const title = computed(() => (locale.value === 'en' ? props.post.titleEn : props.post.titleRu))
const excerpt = computed(() => (locale.value === 'en' ? props.post.excerptEn : props.post.excerptRu))
</script>

<template>
  <article class="surface-card overflow-hidden transition hover:shadow-(--shadow-card)">
    <NuxtLink
      :to="localePath(`/blog/${post.slug}`)"
      class="block"
    >
      <div
        v-if="post.coverImageUrl"
        class="aspect-video overflow-hidden bg-stone-100 dark:bg-stone-800"
      >
        <img
          :src="post.coverImageUrl"
          :alt="title"
          class="size-full object-cover"
          loading="lazy"
        >
      </div>
      <div
        v-else
        class="flex aspect-video items-center justify-center bg-brand-50 dark:bg-brand-950/50"
      >
        <Icon
          name="ph:article-duotone"
          class="size-12 text-brand-400 dark:text-brand-600"
        />
      </div>

      <div class="space-y-2 p-4">
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ title }}
        </h2>
        <p
          v-if="excerpt"
          class="line-clamp-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400"
        >
          {{ excerpt }}
        </p>
        <span class="inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-400">
          {{ $t('blog.readMore') }}
          <Icon
            name="ph:arrow-right"
            class="size-4"
          />
        </span>
      </div>
    </NuxtLink>
  </article>
</template>
