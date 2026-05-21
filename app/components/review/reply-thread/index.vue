<script setup lang="ts">
import type { ReviewReply } from '#shared/types/review'
import type { ReviewReplyThreadEmits, ReviewReplyThreadProps } from './types'

const props = withDefaults(defineProps<ReviewReplyThreadProps>(), {
  depth: 0,
})

const emit = defineEmits<ReviewReplyThreadEmits>()

const { locale } = useI18n()

const replyTargetId = ref<string | null>(null)

const authorLabel = (reply: ReviewReply) =>
  reply.authorRole === 'host' ? props.labels.host : (reply.authorName ?? props.labels.guest)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value, { day: 'numeric', month: 'short', year: 'numeric' })

const openReplyForm = (parentId: string | null) => {
  replyTargetId.value = replyTargetId.value === parentId ? null : parentId
}

const handleSubmitted = () => {
  replyTargetId.value = null
  emit('refresh')
}
</script>

<template>
  <div
    v-if="depth === 0 && canReplyToReview"
    class="mt-4 border-t border-stone-100 pt-4 dark:border-stone-800"
  >
    <ReviewReplyForm
      :review-id="reviewId"
      :placeholder="labels.replyPlaceholder"
      :submit-label="labels.submit"
      @submitted="handleSubmitted"
    />
  </div>

  <ul
    v-if="replies.length"
    class="mt-4 space-y-4"
    :class="depth > 0 ? 'ml-4 border-l border-stone-200 pl-4 dark:border-stone-700 sm:ml-6 sm:pl-5' : ''"
  >
    <li
      v-for="reply in replies"
      :key="reply.id"
      class="space-y-2"
    >
      <div class="rounded-xl bg-stone-50 px-4 py-3 dark:bg-stone-900/60">
        <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {{ authorLabel(reply) }}
          </p>
          <time
            :datetime="reply.createdAt"
            class="text-xs text-stone-500 dark:text-stone-400"
          >
            {{ formatDate(reply.createdAt) }}
          </time>
        </div>
        <p class="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          {{ reply.text }}
        </p>
        <button
          v-if="canReplyToReply(reply)"
          type="button"
          class="mt-2 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
          @click="openReplyForm(reply.id)"
        >
          {{ labels.reply }}
        </button>
      </div>

      <ReviewReplyForm
        v-if="replyTargetId === reply.id"
        :review-id="reviewId"
        :parent-reply-id="reply.id"
        :placeholder="labels.replyPlaceholder"
        :submit-label="labels.submit"
        @submitted="handleSubmitted"
      />

      <ReviewReplyThread
        v-if="reply.children.length"
        :review-id="reviewId"
        :replies="reply.children"
        :depth="depth + 1"
        :labels="labels"
        :can-reply-to-review="false"
        :can-reply-to-reply="canReplyToReply"
        @refresh="emit('refresh')"
      />
    </li>
  </ul>
</template>
