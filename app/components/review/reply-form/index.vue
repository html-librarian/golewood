<script setup lang="ts">
import type { ReviewReplyFormEmits, ReviewReplyFormProps } from './types'

const props = defineProps<ReviewReplyFormProps>()
const emit = defineEmits<ReviewReplyFormEmits>()

const { createReviewReply } = useReviews()

const text = ref('')
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  const trimmed = text.value.trim()

  if (!trimmed) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    await createReviewReply(props.reviewId, {
      text: trimmed,
      parentReplyId: props.parentReplyId ?? undefined,
    })
    text.value = ''
    emit('submitted')
  } catch {
    error.value = 'submit_failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form
    class="space-y-2"
    @submit.prevent="handleSubmit"
  >
    <FormTextarea
      v-model="text"
      :placeholder="placeholder"
      :rows="3"
    />
    <p
      v-if="error"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ $t('review.replySubmitError') }}
    </p>
    <UiButton
      type="submit"
      size="sm"
      :loading="loading"
      :disabled="!text.trim()"
    >
      {{ submitLabel }}
    </UiButton>
  </form>
</template>
