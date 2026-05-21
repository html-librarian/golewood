<script setup lang="ts">
import type { ListingTeamReviewSnippetProps } from './types'

const props = defineProps<ListingTeamReviewSnippetProps>()

const { locale } = useI18n()
const localePath = useLocalePath()

const title = computed(() => (locale.value === 'en' ? props.blogPost.titleEn : props.blogPost.titleRu))

const excerpt = computed(() => {
  if (locale.value === 'en') {
    return props.excerptEn || props.blogPost.excerptEn || props.blogPost.excerptRu
  }

  return props.excerptRu || props.blogPost.excerptRu || props.blogPost.excerptEn
})
</script>

<template>
  <section class="rounded-xl border border-brand-200/80 bg-brand-50/80 p-4 dark:border-brand-800 dark:bg-brand-950/50">
    <div class="flex flex-wrap items-center gap-2">
      <ListingTeamBadge
        :badge="badge"
        size="md"
      />
      <span class="text-sm font-semibold text-stone-800 dark:text-stone-200">
        {{ $t('listing.teamReviewTitle') }}
      </span>
    </div>
    <h3 class="mt-3 font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
      {{ title }}
    </h3>
    <p
      v-if="excerpt"
      class="mt-2 line-clamp-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300"
    >
      {{ excerpt }}
    </p>
    <NuxtLink
      :to="localePath(`/blog/${blogPost.slug}`)"
      class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:underline dark:text-brand-300"
    >
      <Icon
        name="ph:article-duotone"
        class="size-4"
      />
      {{ $t('listing.teamReviewReadFull') }}
    </NuxtLink>
  </section>
</template>
