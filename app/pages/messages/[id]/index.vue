<script setup lang="ts">
import { GOLEWOOD_BOT_USER_ID } from '#shared/constants/golewood-bot'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth' })

const { t } = usePageI18n({ ru, en })
const route = useRoute()
const localePath = useLocalePath()
const { user } = useAuth()
const { fetchConversation, sendMessage } = useConversations()
const { refreshUnreadCount } = useMessagesUnread()

const conversationId = computed(() => String(route.params.id))
const draft = ref('')
const sending = ref(false)
const sendError = ref('')

const { data: conversation, error, pending } = await useAsyncData(
  () => `conversation-${conversationId.value}`,
  () => fetchConversation(conversationId.value),
)

const userMessages = computed(() =>
  conversation.value?.messages.filter(message => !message.isSystem) ?? [],
)

const otherParty = computed(() => {
  if (!conversation.value || !user.value) {
    return ''
  }

  if (user.value.id === conversation.value.guest.id) {
    return conversation.value.host.name ?? conversation.value.host.phone
  }

  return conversation.value.guest.name ?? conversation.value.guest.phone
})

const handleSend = async () => {
  const body = draft.value.trim()

  if (!body || sending.value) {
    return
  }

  sending.value = true
  sendError.value = ''

  try {
    const message = await sendMessage(conversationId.value, { body })

    if (conversation.value) {
      conversation.value = {
        ...conversation.value,
        messages: [...conversation.value.messages, message],
      }
    }

    draft.value = ''
    await refreshUnreadCount()
  } catch {
    sendError.value = t('sendError')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="page-container flex max-w-2xl flex-col">
    <div class="mb-4">
      <NuxtLink
        :to="localePath('/messages')"
        class="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
      >
        <Icon
          name="ph:arrow-left"
          class="size-4"
        />
        {{ t('back') }}
      </NuxtLink>
    </div>

    <div
      v-if="pending && !conversation"
      class="surface-card space-y-3 p-5"
    >
      <UiSkeleton variant="title" class="w-2/3" />
      <UiSkeleton class="h-32 w-full" />
    </div>

    <UiEmpty
      v-else-if="error"
      icon="ph:chat-circle-dots-duotone"
      :title="t('loadError')"
    />

    <template v-else-if="conversation">
      <header class="mb-4">
        <h1 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
          {{ conversation.listingTitle }}
        </h1>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {{ otherParty }}
        </p>
      </header>

      <div
        class="surface-card mb-4 min-h-[280px] flex-1 space-y-3 overflow-y-auto p-4"
        data-testid="message-thread"
      >
        <p
          v-if="!userMessages.length"
          class="text-sm text-stone-500 dark:text-stone-400"
        >
          {{ t('emptyThread') }}
        </p>

        <template
          v-for="message in conversation.messages"
          :key="message.id"
        >
          <div
            v-if="message.isSystem || message.senderId === GOLEWOOD_BOT_USER_ID"
            class="flex justify-center"
            data-testid="message-bot"
          >
            <div
              class="flex max-w-[95%] items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs leading-relaxed text-brand-900 dark:border-brand-900 dark:bg-brand-950/60 dark:text-brand-100"
            >
              <Icon
                name="ph:robot-duotone"
                class="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-400"
              />
              <span>{{ message.body }}</span>
            </div>
          </div>

          <div
            v-else
            class="flex"
            :class="message.senderId === user?.id ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[85%] rounded-2xl px-4 py-2 text-sm"
              :class="message.senderId === user?.id
                ? 'bg-brand-700 text-white dark:bg-brand-600'
                : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-100'"
              data-testid="message-bubble"
            >
              {{ message.body }}
            </div>
          </div>
        </template>
      </div>

      <form
        class="flex gap-2"
        @submit.prevent="handleSend()"
      >
        <input
          v-model="draft"
          type="text"
          data-testid="message-input"
          :placeholder="t('placeholder')"
          class="form-input flex-1"
          maxlength="2000"
          @keyup.enter="handleSend()"
        >
        <UiButton
          type="submit"
          data-testid="message-send"
          :loading="sending"
          :disabled="!draft.trim()"
        >
          {{ t('send') }}
        </UiButton>
      </form>

      <p
        v-if="sendError"
        class="mt-2 text-sm text-red-600 dark:text-red-400"
      >
        {{ sendError }}
      </p>
    </template>
  </div>
</template>
