<script setup lang="ts">
import type { UserStory } from '#shared/types/story'
import { staggerDelayMs } from '#shared/utils/stagger-delay'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth' })

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { locale } = useI18n()
const { user } = useAuth()
const { fetchMyStories } = useStories()

const viewerOpen = ref(false)
const viewerStories = ref<UserStory[]>([])
const viewerStart = ref(0)

const { data: myStories, pending } = await useAsyncData('my-stories', () => fetchMyStories())

const activeStories = computed(() => myStories.value?.active ?? [])
const archiveStories = computed(() => myStories.value?.archive ?? [])
const hasAnyStories = computed(() => activeStories.value.length + archiveStories.value.length > 0)

const formatExpiredDate = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const openViewer = (stories: UserStory[], index: number) => {
  viewerStories.value = stories
  viewerStart.value = index
  viewerOpen.value = true
}
</script>

<template>
  <div class="page-container">
    <UiPageHeader
      :title="t('title')"
      :subtitle="t('subtitle')"
    />

    <p
      v-if="user?.role !== 'guest'"
      class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
    >
      {{ $t('story.guestOnlyPage') }}
    </p>

    <UiEmpty
      v-else-if="!pending && !hasAnyStories"
      icon="ph:circle-half-duotone"
      :title="t('empty')"
      :description="t('emptyHint')"
    >
      <NuxtLink :to="localePath('/search')">
        <UiButton>{{ $t('common.search') }}</UiButton>
      </NuxtLink>
    </UiEmpty>

    <template v-else-if="user?.role === 'guest'">
      <UiReveal>
      <section
        v-if="activeStories.length"
        class="space-y-4"
      >
        <StoryRing
          :stories="activeStories"
          :label="t('guestStories')"
          @open="openViewer(activeStories, $event)"
        />

        <ul class="space-y-3">
          <li
            v-for="(story, index) in activeStories"
            :key="story.id"
            class="reveal-stagger-item surface-card flex items-center gap-4 p-3"
            :style="{ transitionDelay: `${staggerDelayMs(index, 45, 270)}ms` }"
          >
            <button
              type="button"
              class="shrink-0"
              @click="openViewer(activeStories, index)"
            >
              <img
                v-if="story.mediaType === 'image'"
                :src="story.mediaUrl"
                alt=""
                class="size-14 rounded-lg object-cover"
              >
              <video
                v-else
                :src="story.mediaUrl"
                class="size-14 rounded-lg object-cover"
                muted
                playsinline
                preload="metadata"
              />
            </button>
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
      </section>
      </UiReveal>

      <UiReveal :delay="60">
      <section
        class="mt-10 space-y-4"
        :class="activeStories.length ? 'border-t border-stone-200 pt-10 dark:border-stone-800' : ''"
      >
        <h2 class="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {{ t('archive') }}
        </h2>

        <p
          v-if="!archiveStories.length"
          class="text-sm text-stone-500 dark:text-stone-400"
        >
          {{ t('archiveEmpty') }}
        </p>

        <ul
          v-else
          class="space-y-3"
        >
          <li
            v-for="(story, index) in archiveStories"
            :key="story.id"
            class="reveal-stagger-item surface-card flex items-center gap-4 p-3 opacity-90"
            :style="{ transitionDelay: `${staggerDelayMs(index, 45, 270)}ms` }"
          >
            <button
              type="button"
              class="shrink-0"
              @click="openViewer(archiveStories, index)"
            >
              <img
                v-if="story.mediaType === 'image'"
                :src="story.mediaUrl"
                alt=""
                class="size-14 rounded-lg object-cover grayscale-[0.15]"
              >
              <video
                v-else
                :src="story.mediaUrl"
                class="size-14 rounded-lg object-cover opacity-90"
                muted
                playsinline
                preload="metadata"
              />
            </button>
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
              <p class="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                {{ t('expiredAt', { date: formatExpiredDate(story.expiresAt) }) }}
              </p>
            </div>
          </li>
        </ul>
      </section>
      </UiReveal>
    </template>

    <StoryViewer
      v-if="viewerStories.length"
      :stories="viewerStories"
      :start-index="viewerStart"
      :open="viewerOpen"
      @update:open="viewerOpen = $event"
    />
  </div>
</template>
