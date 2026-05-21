<script setup lang="ts">
import type { ListingNewsCarouselProps } from './types'

const props = defineProps<ListingNewsCarouselProps>()

const trackRef = ref<HTMLElement | null>(null)
const canScroll = ref(false)

const updateCanScroll = () => {
  const track = trackRef.value

  if (!track) {
    canScroll.value = false
    return
  }

  canScroll.value = track.scrollWidth > track.clientWidth + 8
}

const scrollBy = (direction: -1 | 1) => {
  const track = trackRef.value

  if (!track) {
    return
  }

  const card = track.querySelector<HTMLElement>('[data-testid="listing-news-card"]')
  const step = card ? card.offsetWidth + 16 : 280
  track.scrollBy({ left: direction * step, behavior: 'smooth' })
}

onMounted(() => {
  updateCanScroll()
  window.addEventListener('resize', updateCanScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCanScroll)
})

watch(() => props.items.length, () => nextTick(() => updateCanScroll()))
</script>

<template>
  <section class="space-y-4">
    <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
      {{ $t('listingNews.title') }}
    </h2>

    <div class="relative">
      <div
        ref="trackRef"
        class="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        <div
          v-for="item in items"
          :key="item.id"
          class="w-[min(100%,16rem)] shrink-0 snap-start sm:w-56"
        >
          <ListingNewsCard
            :item="item"
            :listing-id="listingId"
          />
        </div>
      </div>

      <button
        v-if="canScroll"
        type="button"
        class="absolute -left-2 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-stone-700 shadow-sm transition hover:bg-white md:flex dark:border-stone-700 dark:bg-stone-900/95 dark:text-stone-200"
        :aria-label="$t('listingNews.scrollPrev')"
        @click="scrollBy(-1)"
      >
        <Icon
          name="ph:caret-left-bold"
          class="size-5"
        />
      </button>
      <button
        v-if="canScroll"
        type="button"
        class="absolute -right-2 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-stone-700 shadow-sm transition hover:bg-white md:flex dark:border-stone-700 dark:bg-stone-900/95 dark:text-stone-200"
        :aria-label="$t('listingNews.scrollNext')"
        @click="scrollBy(1)"
      >
        <Icon
          name="ph:caret-right-bold"
          class="size-5"
        />
      </button>
    </div>
  </section>
</template>
