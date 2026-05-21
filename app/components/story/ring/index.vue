<script setup lang="ts">
import type { StoryRingEmits, StoryRingProps } from './types'

defineProps<StoryRingProps>()
const emit = defineEmits<StoryRingEmits>()
</script>

<template>
  <div
    v-if="stories.length"
    class="space-y-2"
  >
    <p
      v-if="label"
      class="text-sm font-medium text-stone-700 dark:text-stone-300"
    >
      {{ label }}
    </p>

    <div class="flex gap-3 overflow-x-auto pb-1">
      <button
        v-for="(story, index) in stories"
        :key="story.id"
        type="button"
        class="shrink-0 rounded-full bg-linear-to-tr from-brand-500 via-accent-400 to-brand-600 p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        @click="emit('open', index)"
      >
        <span class="relative block size-14 overflow-hidden rounded-full border-2 border-white bg-stone-200 dark:border-stone-900 dark:bg-stone-800">
          <img
            v-if="story.mediaType === 'image'"
            :src="story.mediaUrl"
            :alt="story.authorName ?? story.listingTitle ?? ''"
            class="size-full object-cover"
          >
          <video
            v-else
            :src="story.mediaUrl"
            class="size-full object-cover"
            muted
            playsinline
            preload="metadata"
          />
          <Icon
            v-if="story.mediaType === 'video'"
            name="ph:play-fill"
            class="absolute bottom-0.5 right-0.5 size-4 text-white drop-shadow"
          />
        </span>
      </button>
    </div>
  </div>
</template>
