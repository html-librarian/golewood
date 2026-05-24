<script setup lang="ts">
import type { ListingGalleryProps } from './types'
import ru from './i18n/ru'
import en from './i18n/en'

const props = withDefaults(defineProps<ListingGalleryProps>(), {
  layout: 'mosaic',
})
const { t } = usePageI18n({ ru, en })

const isMosaic = computed(() => props.layout === 'mosaic')
const mosaicPhotos = computed(() => props.photos.slice(0, 5))
const mosaicExtraCount = computed(() => Math.max(0, props.photos.length - 5))

const mosaicGridClass = computed(() => {
  const count = mosaicPhotos.value.length

  if (count <= 1) {
    return ''
  }

  if (count === 2) {
    return 'grid h-[min(320px,45vh)] grid-cols-2 gap-2'
  }

  return 'grid h-[min(420px,55vh)] grid-cols-4 grid-rows-2 gap-2'
})

const mosaicTileClass = (index: number) => {
  const count = mosaicPhotos.value.length

  if (count <= 1) {
    return ''
  }

  if (count === 2) {
    return 'min-h-0'
  }

  if (index === 0) {
    return 'col-span-2 row-span-2 min-h-0'
  }

  if (index === 1) {
    return 'col-start-3 row-start-1 min-h-0'
  }

  if (index === 2) {
    return count === 3 ? 'col-start-4 row-span-2 row-start-1 min-h-0' : 'col-start-4 row-start-1 min-h-0'
  }

  if (index === 3) {
    return 'col-start-3 row-start-2 min-h-0'
  }

  return 'col-start-4 row-start-2 min-h-0'
}

const activeIndex = ref(0)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const activeItem = computed(() => props.photos[activeIndex.value] ?? null)
const lightboxItem = computed(() => props.photos[lightboxIndex.value] ?? null)

const selectSlide = (index: number) => {
  if (index < 0 || index >= props.photos.length) {
    return
  }

  activeIndex.value = index
}

const openLightbox = (index: number) => {
  if (!props.photos.length) {
    return
  }

  lightboxIndex.value = index
  lightboxOpen.value = true
}

const closeLightbox = () => {
  lightboxOpen.value = false
}

const goPrev = () => {
  if (lightboxIndex.value > 0) {
    lightboxIndex.value -= 1
  }
}

const goNext = () => {
  if (lightboxIndex.value < props.photos.length - 1) {
    lightboxIndex.value += 1
  }
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

const onKeydown = (event: KeyboardEvent) => {
  if (!lightboxOpen.value) {
    return
  }

  if (event.key === 'Escape') {
    closeLightbox()
  }

  if (event.key === 'ArrowLeft') {
    goPrev()
  }

  if (event.key === 'ArrowRight') {
    goNext()
  }
}

watch(lightboxOpen, (isOpen) => {
  if (import.meta.client) {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)

  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <div>
    <div
      v-if="isMosaic"
    :class="mosaicPhotos.length <= 1 ? 'space-y-0' : mosaicGridClass"
  >
    <button
      v-for="(item, index) in mosaicPhotos"
      :key="item.id"
      type="button"
      class="group relative overflow-hidden rounded-2xl bg-stone-100 text-left dark:bg-stone-800"
      :class="[
        mosaicPhotos.length <= 1 ? 'aspect-16/10 w-full' : mosaicTileClass(index),
      ]"
      :aria-label="t('showPhoto', { current: index + 1, total: photos.length })"
      @click="openLightbox(index)"
    >
      <iframe
        v-if="item.mediaType === 'video' && item.embedUrl"
        :src="item.embedUrl"
        class="pointer-events-none h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        title=""
      />
      <ListingImage
        v-else-if="item.url"
        :src="item.url"
        :alt="`${title} ${index + 1}`"
        :eager="index === 0"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
      />
      <ListingImagePlaceholder
        v-else
        show-label
        class="h-full min-h-32"
      />

      <span
        v-if="item.mediaType === 'video'"
        class="absolute inset-0 z-10 flex items-center justify-center bg-stone-900/35"
      >
        <Icon
          name="ph:play-circle-duotone"
          class="size-12 text-white"
        />
      </span>

      <span
        v-if="index === mosaicPhotos.length - 1 && mosaicExtraCount > 0"
        class="absolute inset-0 z-10 flex items-center justify-center bg-stone-900/55 text-lg font-semibold text-white"
      >
        +{{ mosaicExtraCount }}
      </span>

      <span
        v-if="index === 0 && photos.length > 1"
        class="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-stone-900/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
      >
        <Icon
          name="ph:squares-four-duotone"
          class="size-4"
          aria-hidden="true"
        />
        {{ t('viewAllPhotos', { count: photos.length }) }}
      </span>
    </button>

    <ListingImagePlaceholder
      v-if="!mosaicPhotos.length"
      show-label
      class="aspect-16/10 w-full rounded-2xl"
    />
    </div>

    <div
      v-else
      class="space-y-3"
    >
    <button
      type="button"
      class="group relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-stone-100 text-left dark:bg-stone-800"
      :aria-label="t('openGallery')"
      @click="openLightbox(activeIndex)"
    >
      <iframe
        v-if="activeItem?.mediaType === 'video' && activeItem.embedUrl"
        :src="activeItem.embedUrl"
        class="pointer-events-none h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        title=""
      />
      <ListingImage
        v-else-if="activeItem"
        :src="activeItem.url"
        :alt="title"
        eager
        class="h-full w-full transition duration-300 group-hover:scale-[1.02]"
      />
      <ListingImagePlaceholder
        v-else
        show-label
      />

      <span
        v-if="photos.length > 1"
        class="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-stone-900/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition group-hover:bg-stone-900/90"
      >
        <Icon
          name="ph:squares-four-duotone"
          class="size-4"
          aria-hidden="true"
        />
        {{ t('viewAllPhotos', { count: photos.length }) }}
      </span>
    </button>

    <div
      v-if="photos.length > 1"
      class="flex gap-2 overflow-x-auto pb-1"
    >
      <button
        v-for="(item, index) in photos"
        :key="item.id"
        type="button"
        class="relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition"
        :class="index === activeIndex ? 'border-brand-600 ring-2 ring-brand-500/30' : 'border-transparent opacity-80 hover:opacity-100'"
        :aria-label="t('showPhoto', { current: index + 1, total: photos.length })"
        :aria-current="index === activeIndex ? 'true' : undefined"
        @click="selectSlide(index)"
      >
        <span
          v-if="item.mediaType === 'video'"
          class="absolute inset-0 z-10 flex items-center justify-center bg-stone-900/50"
        >
          <Icon
            name="ph:play-circle-duotone"
            class="size-8 text-white"
          />
        </span>
        <ListingImage
          v-if="item.url"
          :src="item.url"
          :alt="`${title} ${index + 1}`"
        />
      </button>
    </div>
    </div>

    <Teleport to="body">
      <div
        v-if="lightboxOpen && lightboxItem"
        class="fixed inset-0 z-100 flex flex-col bg-black/95"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-between gap-3 px-4 py-3 text-white">
          <p class="text-sm font-medium tabular-nums">
            {{ t('counter', { current: lightboxIndex + 1, total: photos.length }) }}
          </p>
          <button
            type="button"
            class="rounded-full p-2 hover:bg-white/10"
            :aria-label="t('close')"
            @click="closeLightbox"
          >
            <Icon
              name="ph:x-bold"
              class="size-6"
            />
          </button>
        </div>

        <div
          class="relative flex min-h-0 flex-1 items-center justify-center px-2"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        >
          <button
            v-if="lightboxIndex > 0"
            type="button"
            class="absolute top-1/2 left-2 z-10 flex size-11 shrink-0 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:left-4"
            :aria-label="t('previous')"
            @click="goPrev"
          >
            <Icon
              name="ph:caret-left-bold"
              class="size-7 shrink-0"
              aria-hidden="true"
            />
          </button>

          <div class="flex max-h-full max-w-full items-center justify-center px-12 sm:px-16">
            <iframe
              v-if="lightboxItem.mediaType === 'video' && lightboxItem.embedUrl"
              :src="lightboxItem.embedUrl"
              class="aspect-video w-[min(90vw,960px)] border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              title=""
            />
            <img
              v-else-if="lightboxItem.url"
              :src="lightboxItem.url"
              :alt="`${title} ${lightboxIndex + 1}`"
              class="max-h-[min(75vh,900px)] max-w-full object-contain"
            >
          </div>

          <button
            v-if="lightboxIndex < photos.length - 1"
            type="button"
            class="absolute top-1/2 right-2 z-10 flex size-11 shrink-0 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:right-4"
            :aria-label="t('next')"
            @click="goNext"
          >
            <Icon
              name="ph:caret-right-bold"
              class="size-7 shrink-0"
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          v-if="photos.length > 1"
          class="flex gap-2 overflow-x-auto px-4 pb-4 pt-2"
        >
          <button
            v-for="(item, index) in photos"
            :key="`lb-${item.id}`"
            type="button"
            class="relative size-14 shrink-0 overflow-hidden rounded-lg border-2 transition"
            :class="index === lightboxIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'"
            @click="lightboxIndex = index"
          >
            <ListingImage
              v-if="item.url"
              :src="item.url"
              :alt="`${title} ${index + 1}`"
            />
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
