<script setup lang="ts">
import type { BlogAuthorCardProps } from './types'

const props = withDefaults(defineProps<BlogAuthorCardProps>(), {
  showFollow: true,
})

const { t } = useI18n()
const { user } = useAuth()
const localePath = useLocalePath()

const authorName = computed(() =>
  props.author.name?.trim() || t('blog.anonymousAuthor'),
)

const isSelf = computed(() => user.value?.id === props.author.id)
</script>

<template>
  <article class="surface-card-interactive group relative flex flex-col gap-3 overflow-hidden p-4">
    <span
      class="card-crown"
      aria-hidden="true"
    />
    <NuxtLink
      :to="localePath(`/blog/authors/${author.id}`)"
      class="space-y-1"
    >
      <p class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
        {{ authorName }}
      </p>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('blog.authorMeta', { posts: author.postCount, followers: author.followerCount }) }}
      </p>
    </NuxtLink>

    <BlogFollowButton
      v-if="showFollow && !isSelf"
      :author-id="author.id"
      :initial-following="Boolean(author.isFollowing)"
      size="sm"
    />
  </article>
</template>
