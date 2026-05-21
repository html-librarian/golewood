<script setup lang="ts">
import type { ListingNewsReaction } from '#shared/types/listing-news'
import type { ListingNewsReactionsEmits, ListingNewsReactionsProps } from './types'

const props = defineProps<ListingNewsReactionsProps>()
const emit = defineEmits<ListingNewsReactionsEmits>()

const { setReaction } = useListingNews()
const { isAuthenticated } = useAuth()
const localePath = useLocalePath()

const likes = ref(props.likesCount)
const dislikes = ref(props.dislikesCount)
const userReaction = ref<ListingNewsReaction | null>(props.userReaction ?? null)
const loading = ref(false)

watch(() => [props.likesCount, props.dislikesCount, props.userReaction], () => {
  likes.value = props.likesCount
  dislikes.value = props.dislikesCount
  userReaction.value = props.userReaction ?? null
})

const handleReaction = async (reaction: ListingNewsReaction) => {
  if (!isAuthenticated.value) {
    await navigateTo(localePath('/auth/login'))
    return
  }

  loading.value = true

  try {
    const result = await setReaction(props.listingId, props.newsId, reaction)
    likes.value = result.likesCount
    dislikes.value = result.dislikesCount
    userReaction.value = result.userReaction
    emit('updated', {
      likesCount: result.likesCount,
      dislikesCount: result.dislikesCount,
      userReaction: result.userReaction,
    })
  } finally {
    loading.value = false
  }
}

const buttonClass = (active: boolean) => [
  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
  active
    ? 'border-brand-600 bg-brand-50 text-brand-800 dark:border-brand-500 dark:bg-brand-950/50 dark:text-brand-200'
    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300',
]
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-3"
    data-testid="listing-news-reactions"
  >
    <button
      type="button"
      :class="buttonClass(userReaction === 'like')"
      :disabled="loading"
      @click="handleReaction('like')"
    >
      <Icon
        name="ph:thumbs-up"
        class="size-5"
      />
      {{ likes }}
    </button>
    <button
      type="button"
      :class="buttonClass(userReaction === 'dislike')"
      :disabled="loading"
      @click="handleReaction('dislike')"
    >
      <Icon
        name="ph:thumbs-down"
        class="size-5"
      />
      {{ dislikes }}
    </button>
  </div>
</template>
