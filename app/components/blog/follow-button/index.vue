<script setup lang="ts">
import type { BlogFollowButtonEmits, BlogFollowButtonProps } from './types'

const props = withDefaults(defineProps<BlogFollowButtonProps>(), {
  initialFollowing: false,
  size: 'md',
})

const emit = defineEmits<BlogFollowButtonEmits>()

const { t } = useI18n()
const { isAuthenticated } = useAuth()
const localePath = useLocalePath()
const { followAuthor, unfollowAuthor } = useBlog()

const following = ref(props.initialFollowing)
const loading = ref(false)

watch(() => props.initialFollowing, (value) => {
  following.value = value
})

const toggleFollow = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(localePath('/auth/login'))
    return
  }

  loading.value = true

  try {
    if (following.value) {
      await unfollowAuthor(props.authorId)
      following.value = false
    } else {
      await followAuthor(props.authorId)
      following.value = true
    }

    emit('update', following.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UiButton
    type="button"
    data-testid="blog-follow-button"
    :size="size"
    :variant="following ? 'outline' : 'primary'"
    :loading="loading"
    @click="toggleFollow()"
  >
    {{ following ? t('blog.unfollowAuthor') : t('blog.followAuthor') }}
  </UiButton>
</template>
