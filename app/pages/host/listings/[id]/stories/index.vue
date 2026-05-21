<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
})

const { t } = usePageI18n({ ru, en })
const route = useRoute()
const localePath = useLocalePath()
const { fetchHostListingStories, pinStory, unpinStory } = useStories()

const listingId = computed(() => String(route.params.id))
const togglingId = ref<string | null>(null)

const { data: stories, refresh, pending } = await useAsyncData(
  () => `host-listing-stories-${listingId.value}`,
  () => fetchHostListingStories(listingId.value),
)

const togglePin = async (storyId: string, pinned: boolean) => {
  togglingId.value = storyId

  try {
    if (pinned) {
      await unpinStory(listingId.value, storyId)
    } else {
      await pinStory(listingId.value, storyId)
    }

    await refresh()
  } finally {
    togglingId.value = null
  }
}
</script>

<template>
  <div class="page-container">
    <NuxtLink
      :to="localePath('/host/listings')"
      class="mb-4 inline-flex text-sm text-brand-700 hover:underline dark:text-brand-400"
    >
      ← {{ t('back') }}
    </NuxtLink>

    <h1 class="section-title mb-6">
      {{ t('title') }}
    </h1>

    <UiEmpty
      v-if="!pending && !stories?.length"
      icon="ph:circle-half-duotone"
      :title="t('empty')"
    />

    <ul
      v-else
      class="space-y-4"
    >
      <li
        v-for="story in stories"
        :key="story.id"
        class="surface-card flex flex-wrap items-center gap-4 p-4"
      >
        <img
          v-if="story.mediaType === 'image'"
          :src="story.mediaUrl"
          alt=""
          class="size-20 shrink-0 rounded-lg object-cover"
        >
        <video
          v-else
          :src="story.mediaUrl"
          class="size-20 shrink-0 rounded-lg object-cover"
          muted
          playsinline
          preload="metadata"
        />
        <div class="min-w-0 flex-1">
          <p class="font-medium text-stone-900 dark:text-stone-50">
            {{ story.authorName ?? t('author') }}
          </p>
          <UiBadge
            v-if="story.pinned"
            variant="success"
            class="mt-2"
          >
            {{ t('pinned') }}
          </UiBadge>
        </div>
        <UiButton
          size="sm"
          :variant="story.pinned ? 'outline' : 'primary'"
          :loading="togglingId === story.id"
          @click="togglePin(story.id, Boolean(story.pinned))"
        >
          {{ story.pinned ? t('unpin') : t('pin') }}
        </UiButton>
      </li>
    </ul>
  </div>
</template>
