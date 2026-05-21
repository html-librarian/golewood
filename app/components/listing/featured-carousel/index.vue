<script setup lang="ts">
import type { ListingCard } from '#shared/types/listing'
import type { ListingFeaturedCarouselProps } from './types'

const props = withDefaults(defineProps<ListingFeaturedCarouselProps>(), {
  perPage: 4,
  autoplayMs: 5000,
})

const pages = computed(() => {
  const chunks: ListingCard[][] = []

  for (let index = 0; index < props.listings.length; index += props.perPage) {
    chunks.push(props.listings.slice(index, index + props.perPage))
  }

  return chunks
})

const activePage = ref(0)
const paused = ref(false)
const prefersReducedMotion = ref(false)

let autoplayTimer: ReturnType<typeof setInterval> | undefined

const pageCount = computed(() => pages.value.length)
const canAutoplay = computed(() => pageCount.value > 1 && !prefersReducedMotion.value)

const goToPage = (index: number) => {
  if (!pageCount.value) {
    return
  }

  const normalized = ((index % pageCount.value) + pageCount.value) % pageCount.value
  activePage.value = normalized
}

const nextPage = () => goToPage(activePage.value + 1)
const prevPage = () => goToPage(activePage.value - 1)

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = undefined
  }
}

const startAutoplay = () => {
  stopAutoplay()

  if (!canAutoplay.value || paused.value) {
    return
  }

  autoplayTimer = setInterval(() => {
    nextPage()
  }, props.autoplayMs)
}

const onMouseEnter = () => {
  paused.value = true
  stopAutoplay()
}

const onMouseLeave = () => {
  paused.value = false
  startAutoplay()
}

watch([canAutoplay, () => props.listings.length], () => {
  if (activePage.value >= pageCount.value) {
    activePage.value = 0
  }

  startAutoplay()
})

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  startAutoplay()
})

onBeforeUnmount(() => {
  stopAutoplay()
})
</script>

<template>
  <div
    class="relative"
    data-testid="featured-carousel"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div class="overflow-hidden px-4 py-6 -my-6 sm:px-3">
      <div
        class="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
        :style="{ transform: `translateX(-${activePage * 100}%)` }"
      >
        <div
          v-for="(page, pageIndex) in pages"
          :key="pageIndex"
          class="w-full shrink-0"
        >
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            <div
              v-for="listing in page"
              :key="listing.id"
              class="min-w-0 overflow-visible p-2"
            >
              <ListingCard :listing="listing" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template v-if="pageCount > 1">
      <button
        type="button"
        class="absolute left-0 top-[calc(50%-2.5rem)] z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md transition hover:bg-stone-50 md:flex lg:-left-3 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        :aria-label="labels.prev"
        @click="prevPage()"
      >
        <Icon
          name="ph:caret-left-bold"
          class="size-5"
        />
      </button>
      <button
        type="button"
        class="absolute right-0 top-[calc(50%-2.5rem)] z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md transition hover:bg-stone-50 md:flex lg:-right-3 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        :aria-label="labels.next"
        @click="nextPage()"
      >
        <Icon
          name="ph:caret-right-bold"
          class="size-5"
        />
      </button>

      <div
        class="mt-4 flex justify-center gap-2"
        role="tablist"
        :aria-label="labels.pages"
      >
        <button
          v-for="(_, index) in pages"
          :key="index"
          type="button"
          role="tab"
          class="size-2 rounded-full transition"
          :class="index === activePage
            ? 'bg-brand-600 dark:bg-brand-400'
            : 'bg-stone-300 hover:bg-stone-400 dark:bg-stone-600 dark:hover:bg-stone-500'"
          :aria-selected="index === activePage"
          :aria-label="labels.goToPage.replace('{page}', String(index + 1))"
          @click="goToPage(index)"
        />
      </div>
    </template>
  </div>
</template>
