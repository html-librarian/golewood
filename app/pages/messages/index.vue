<script setup lang="ts">
import type { ConversationSummary } from '#shared/types/conversation'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth' })

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { user } = useAuth()
const { fetchConversations } = useConversations()

const { data: conversations, pending } = await useAsyncData('conversations', () => fetchConversations())

const otherParty = (conversation: ConversationSummary) => {
  if (user.value?.id === conversation.guest.id) {
    return conversation.host.name ?? conversation.host.phone
  }

  return conversation.guest.name ?? conversation.guest.phone
}
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="section-subtitle mt-2">
        {{ t('subtitle') }}
      </p>
    </div>

    <div
      v-if="pending"
      class="space-y-3"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="surface-card space-y-2 p-4"
      >
        <UiSkeleton variant="title" class="w-2/3" />
        <UiSkeleton class="w-full" />
      </div>
    </div>

    <UiEmpty
      v-else-if="!conversations?.length"
      icon="ph:chat-circle-dots-duotone"
      :title="t('empty')"
      :description="t('emptyDescription')"
    >
      <NuxtLink :to="localePath('/search')">
        <UiButton>{{ t('explore') }}</UiButton>
      </NuxtLink>
    </UiEmpty>

    <ul
      v-else
      class="space-y-2"
    >
      <li
        v-for="conversation in conversations"
        :key="conversation.id"
      >
        <NuxtLink
          :to="localePath(`/messages/${conversation.id}`)"
          class="surface-card block p-4 transition hover:border-brand-200 dark:hover:border-brand-800"
          :class="conversation.unreadCount > 0 ? 'border-brand-200 dark:border-brand-800' : ''"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p
                class="font-medium text-stone-900 dark:text-stone-50"
                :class="conversation.unreadCount > 0 ? 'font-semibold' : ''"
              >
                {{ conversation.listingTitle }}
              </p>
              <p class="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
                {{ otherParty(conversation) }}
              </p>
              <p
                v-if="conversation.lastMessage"
                class="mt-2 truncate text-sm text-stone-600 dark:text-stone-300"
              >
                {{ conversation.lastMessage.body }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span
                v-if="conversation.unreadCount > 0"
                class="flex size-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white dark:bg-brand-500"
              >
                {{ conversation.unreadCount > 9 ? '9+' : conversation.unreadCount }}
              </span>
              <Icon
                name="ph:caret-right"
                class="size-4 text-stone-400"
              />
            </div>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
