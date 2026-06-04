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
const {
  fetchHostListingStories,
  pinStory,
  unpinStory,
  repostStoryToProfile,
  unrepostStoryFromProfile,
} = useStories()

const listingId = computed(() => String(route.params.id))
const togglingPinId = ref<string | null>(null)
const togglingRepostId = ref<string | null>(null)

const { data: stories, refresh, pending } = await useAsyncData(
  () => `host-listing-stories-${listingId.value}`,
  () => fetchHostListingStories(listingId.value),
)

const activeStories = computed(() => stories.value?.filter(story => !story.isExpired) ?? [])
const archiveStories = computed(() => stories.value?.filter(story => story.isExpired) ?? [])

const togglePin = async (storyId: string, pinned: boolean) => {
  togglingPinId.value = storyId

  try {
    if (pinned) {
      await unpinStory(listingId.value, storyId)
    } else {
      await pinStory(listingId.value, storyId)
    }

    await refresh()
  } finally {
    togglingPinId.value = null
  }
}

const toggleRepost = async (storyId: string, reposted: boolean) => {
  togglingRepostId.value = storyId

  try {
    if (reposted) {
      await unrepostStoryFromProfile(storyId)
    } else {
      await repostStoryToProfile(storyId)
    }

    await refresh()
  } finally {
    togglingRepostId.value = null
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

    <template v-else>
      <section
        v-if="activeStories.length"
        class="space-y-4"
      >
        <h2 class="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {{ t('activeSection') }}
        </h2>

        <ul class="space-y-4">
          <li
            v-for="story in activeStories"
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
              <div class="mt-2 flex flex-wrap gap-2">
                <UiBadge
                  v-if="story.pinned"
                  variant="success"
                >
                  {{ t('pinned') }}
                </UiBadge>
                <UiBadge
                  v-if="story.reposted"
                  variant="brand"
                >
                  {{ t('reposted') }}
                </UiBadge>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <UiButton
                size="sm"
                :variant="story.pinned ? 'outline' : 'primary'"
                :loading="togglingPinId === story.id"
                @click="togglePin(story.id, Boolean(story.pinned))"
              >
                {{ story.pinned ? t('unpin') : t('pin') }}
              </UiButton>
              <UiButton
                size="sm"
                :variant="story.reposted ? 'outline' : 'secondary'"
                :loading="togglingRepostId === story.id"
                @click="toggleRepost(story.id, Boolean(story.reposted))"
              >
                {{ story.reposted ? t('unrepost') : t('repost') }}
              </UiButton>
            </div>
          </li>
        </ul>
      </section>

      <section
        v-if="archiveStories.length"
        class="mt-10 space-y-4"
        :class="activeStories.length ? 'border-t border-stone-200 pt-10 dark:border-stone-800' : ''"
      >
        <h2 class="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {{ t('archiveSection') }}
        </h2>

        <ul class="space-y-4">
          <li
            v-for="story in archiveStories"
            :key="story.id"
            class="surface-card flex flex-wrap items-center gap-4 p-4 opacity-90"
          >
            <img
              v-if="story.mediaType === 'image'"
              :src="story.mediaUrl"
              alt=""
              class="size-20 shrink-0 rounded-lg object-cover grayscale-[0.15]"
            >
            <video
              v-else
              :src="story.mediaUrl"
              class="size-20 shrink-0 rounded-lg object-cover opacity-90"
              muted
              playsinline
              preload="metadata"
            />
            <div class="min-w-0 flex-1">
              <p class="font-medium text-stone-900 dark:text-stone-50">
                {{ story.authorName ?? t('author') }}
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
                <UiBadge variant="muted">
                  {{ t('expired') }}
                </UiBadge>
                <UiBadge
                  v-if="story.reposted"
                  variant="brand"
                >
                  {{ t('reposted') }}
                </UiBadge>
              </div>
              <p class="mt-2 text-xs text-stone-500 dark:text-stone-400">
                {{ t('pinExpiredHint') }}
              </p>
            </div>
            <UiButton
              size="sm"
              :variant="story.reposted ? 'outline' : 'secondary'"
              :loading="togglingRepostId === story.id"
              @click="toggleRepost(story.id, Boolean(story.reposted))"
            >
              {{ story.reposted ? t('unrepost') : t('repost') }}
            </UiButton>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
