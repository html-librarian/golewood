<script setup lang="ts">
import type { StoryViewerEmits, StoryViewerProps } from './types'

const props = withDefaults(defineProps<StoryViewerProps>(), {
  startIndex: 0,
})
const emit = defineEmits<StoryViewerEmits>()

const config = useRuntimeConfig()
const imageDurationMs = computed(() => {
  const ms = Number(config.storyImageDurationMs || 5000)
  return ms > 0 ? ms : 5000
})

const currentIndex = ref(props.startIndex)
const progress = ref(0)
const videoRef = ref<HTMLVideoElement | null>(null)

let progressTimer: ReturnType<typeof setInterval> | null = null

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    currentIndex.value = props.startIndex
  }
})

watch(() => props.startIndex, (index) => {
  currentIndex.value = index
})

const currentStory = computed(() => props.stories[currentIndex.value])

const close = () => emit('update:open', false)

const clearProgressTimer = () => {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

const advanceOrClose = () => {
  if (currentIndex.value < props.stories.length - 1) {
    currentIndex.value += 1
  } else {
    close()
  }
}

const goPrev = () => {
  if (currentIndex.value > 0) {
    clearProgressTimer()
    currentIndex.value -= 1
  }
}

const goNext = () => {
  if (currentIndex.value < props.stories.length - 1) {
    clearProgressTimer()
    currentIndex.value += 1
  } else {
    close()
  }
}

const startImageTimer = () => {
  clearProgressTimer()
  progress.value = 0
  const started = Date.now()

  progressTimer = setInterval(() => {
    const elapsed = Date.now() - started
    progress.value = Math.min(100, (elapsed / imageDurationMs.value) * 100)

    if (elapsed >= imageDurationMs.value) {
      clearProgressTimer()
      advanceOrClose()
    }
  }, 40)
}

const restartStoryPlayback = async () => {
  clearProgressTimer()
  progress.value = 0

  if (!props.open || !currentStory.value) {
    return
  }

  if (currentStory.value.mediaType === 'video') {
    await nextTick()

    if (videoRef.value) {
      videoRef.value.currentTime = 0
      await videoRef.value.play().catch(() => {})
    }

    return
  }

  startImageTimer()
}

watch([() => props.open, currentIndex], restartStoryPlayback, { immediate: true })

const onVideoTimeUpdate = () => {
  const video = videoRef.value

  if (video?.duration) {
    progress.value = (video.currentTime / video.duration) * 100
  }
}

const onVideoEnded = () => {
  advanceOrClose()
}

const touchStartX = ref(0)
const SWIPE_THRESHOLD_PX = 48

const onTouchStart = (event: TouchEvent) => {
  touchStartX.value = event.touches[0]?.clientX ?? 0
}

const onTouchEnd = (event: TouchEvent) => {
  const endX = event.changedTouches[0]?.clientX ?? 0
  const delta = endX - touchStartX.value

  if (Math.abs(delta) < SWIPE_THRESHOLD_PX) {
    return
  }

  if (delta < 0) {
    goNext()
  } else {
    goPrev()
  }
}

const segmentProgress = (index: number) => {
  if (index < currentIndex.value) {
    return 100
  }

  if (index > currentIndex.value) {
    return 0
  }

  return progress.value
}

const onKeydown = (event: KeyboardEvent) => {
  if (!props.open) {
    return
  }

  if (event.key === 'Escape') {
    close()
  }

  if (event.key === 'ArrowLeft') {
    goPrev()
  }

  if (event.key === 'ArrowRight') {
    goNext()
  }
}

watch(() => props.open, (isOpen) => {
  if (import.meta.client) {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }

  if (!isOpen) {
    clearProgressTimer()
  }
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  clearProgressTimer()

  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && currentStory"
      class="fixed inset-0 z-100 flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex gap-1 px-2 pt-2">
        <div
          v-for="(_, index) in stories"
          :key="index"
          class="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
        >
          <div
            class="h-full bg-white transition-[width] duration-75 ease-linear"
            :style="{ width: `${segmentProgress(index)}%` }"
          />
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 px-4 py-3 text-white">
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold">
            {{ currentStory.authorName ?? $t('story.anonymous') }}
          </p>
          <p
            v-if="currentStory.listingTitle"
            class="truncate text-xs text-white/70"
          >
            {{ currentStory.listingTitle }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-full p-2 hover:bg-white/10"
          aria-label="Close"
          @click="close"
        >
          <Icon
            name="ph:x-bold"
            class="size-6"
          />
        </button>
      </div>

      <div
        class="relative flex flex-1 touch-pan-y items-center justify-center px-2"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <button
          v-if="currentIndex > 0"
          type="button"
          class="absolute left-2 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          @click="goPrev"
        >
          <Icon
            name="ph:caret-left-bold"
            class="size-6"
          />
        </button>

        <video
          v-if="currentStory.mediaType === 'video'"
          ref="videoRef"
          :src="currentStory.mediaUrl"
          class="max-h-full max-w-full object-contain"
          playsinline
          muted
          @timeupdate="onVideoTimeUpdate"
          @ended="onVideoEnded"
        />

        <img
          v-else
          :src="currentStory.mediaUrl"
          :alt="currentStory.listingTitle ?? ''"
          class="max-h-full max-w-full object-contain"
        >

        <button
          v-if="currentIndex < stories.length - 1"
          type="button"
          class="absolute right-2 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          @click="goNext"
        >
          <Icon
            name="ph:caret-right-bold"
            class="size-6"
          />
        </button>
      </div>
    </div>
  </Teleport>
</template>
