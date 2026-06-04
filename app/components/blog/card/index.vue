<script setup lang="ts">
import type { BlogCardProps } from './types'

const props = defineProps<BlogCardProps>()

const { locale, t } = useI18n()
const localePath = useLocalePath()

const title = computed(() => (locale.value === 'en' ? props.post.titleEn : props.post.titleRu))
const excerpt = computed(() => (locale.value === 'en' ? props.post.excerptEn : props.post.excerptRu))

const locationLabel = computed(() => {
  const parts = [props.post.city, props.post.listingCity].filter(Boolean)

  return [...new Set(parts)].join(' · ')
})

const authorLabel = computed(() => {
  if (!props.post.authorId) {
    return t('blog.teamReview')
  }

  return props.post.authorName?.trim() || t('blog.anonymousAuthor')
})
</script>

<template>
  <article class="surface-card-interactive group relative overflow-hidden">
    <span
      class="card-crown"
      aria-hidden="true"
    />
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
          class="size-full object-cover transition duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
          <NuxtLink
            v-if="post.authorId"
            :to="localePath(`/blog/authors/${post.authorId}`)"
            class="font-medium text-brand-700 hover:underline dark:text-brand-400"
            @click.stop
          >
            {{ authorLabel }}
          </NuxtLink>
          <span
            v-else
            class="font-medium text-stone-600 dark:text-stone-300"
          >
            {{ authorLabel }}
          </span>
          <span
            v-if="locationLabel"
            aria-hidden="true"
          >
            ·
          </span>
          <span v-if="locationLabel">{{ locationLabel }}</span>
        </div>

        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ title }}
        </h2>
        <p
          v-if="excerpt"
          class="line-clamp-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400"
        >
          {{ excerpt }}
        </p>
        <span class="blog-read-link inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-400">
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
