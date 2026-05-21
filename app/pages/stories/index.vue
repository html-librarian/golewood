<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth' })

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { user } = useAuth()
const { fetchMyStories } = useStories()

const viewerOpen = ref(false)
const viewerStart = ref(0)

const { data: stories, pending } = await useAsyncData('my-stories', () => fetchMyStories())

const openViewer = (index: number) => {
  viewerStart.value = index
  viewerOpen.value = true
}
</script>

<template>
  <div class="page-container">
    <h1 class="section-title mb-6">
      {{ t('title') }}
    </h1>

    <p
      v-if="user?.role !== 'guest'"
      class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
    >
      {{ $t('story.guestOnlyPage') }}
    </p>

    <UiEmpty
      v-else-if="!pending && !stories?.length"
      icon="ph:circle-half-duotone"
      :title="t('empty')"
      :description="t('emptyHint')"
    >
      <NuxtLink :to="localePath('/search')">
        <UiButton>{{ $t('common.search') }}</UiButton>
      </NuxtLink>
    </UiEmpty>

    <template v-else>
      <StoryRing
        :stories="stories ?? []"
        :label="t('guestStories')"
        @open="openViewer"
      />

      <ul class="mt-8 space-y-3">
        <li
          v-for="story in stories"
          :key="story.id"
          class="surface-card flex items-center gap-4 p-3"
        >
          <img
            v-if="story.mediaType === 'image'"
            :src="story.mediaUrl"
            alt=""
            class="size-14 shrink-0 rounded-lg object-cover"
          >
          <video
            v-else
            :src="story.mediaUrl"
            class="size-14 shrink-0 rounded-lg object-cover"
            muted
            playsinline
            preload="metadata"
          />
          <div class="min-w-0 flex-1">
            <NuxtLink
              :to="localePath(`/listings/${story.listingId}`)"
              class="font-medium text-stone-900 hover:text-brand-700 dark:text-stone-50 dark:hover:text-brand-300"
            >
              {{ story.listingTitle }}
            </NuxtLink>
            <p class="text-sm text-stone-500 dark:text-stone-400">
              {{ story.listingCity }}
            </p>
          </div>
        </li>
      </ul>
    </template>

    <StoryViewer
      v-if="stories?.length"
      :stories="stories"
      :start-index="viewerStart"
      :open="viewerOpen"
      @update:open="viewerOpen = $event"
    />
  </div>
</template>
