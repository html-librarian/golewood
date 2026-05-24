<script setup lang="ts">
import type { HomeDiscoveryFilter } from '#shared/catalog/home-discovery'
import { buildSearchRouteQuery } from '#shared/utils/search-query'
import type { HomeDiscoveryDestinationsCarouselEmits, HomeDiscoveryDestinationsCarouselProps } from './types'

const props = defineProps<HomeDiscoveryDestinationsCarouselProps>()
const emit = defineEmits<HomeDiscoveryDestinationsCarouselEmits>()

const { locale, t } = useI18n()
const localePath = useLocalePath()
const { setCity } = useUserCity()

const trackRef = ref<HTMLElement | null>(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)

const labelFor = (filter: HomeDiscoveryFilter) =>
  locale.value === 'en' ? filter.labelEn : filter.labelRu

const searchLink = (filter: HomeDiscoveryFilter) =>
  localePath({
    path: '/search',
    query: buildSearchRouteQuery(filter.params),
  })

const updateScrollState = () => {
  const track = trackRef.value

  if (!track) {
    canScrollPrev.value = false
    canScrollNext.value = false
    return
  }

  const maxScroll = track.scrollWidth - track.clientWidth
  canScrollPrev.value = track.scrollLeft > 4
  canScrollNext.value = track.scrollLeft < maxScroll - 4
}

const scrollByStep = (direction: -1 | 1) => {
  const track = trackRef.value

  if (!track) {
    return
  }

  const step = Math.max(track.clientWidth * 0.85, 280)
  track.scrollBy({ left: direction * step, behavior: 'smooth' })
}

const onSelect = (filter: HomeDiscoveryFilter) => {
  if (filter.params.city) {
    setCity(filter.params.city, 'manual')
  }

  emit('select', filter)
}

onMounted(() => {
  updateScrollState()
  trackRef.value?.addEventListener('scroll', updateScrollState, { passive: true })
  window.addEventListener('resize', updateScrollState)
})

onBeforeUnmount(() => {
  trackRef.value?.removeEventListener('scroll', updateScrollState)
  window.removeEventListener('resize', updateScrollState)
})

watch(() => props.filters.length, () => nextTick(updateScrollState))
</script>

<template>
  <div
    class="relative"
    data-testid="discovery-destinations-carousel"
  >
    <div
      ref="trackRef"
      class="flex gap-3 overflow-x-auto scroll-smooth pb-1 pr-4 [-ms-overflow-style:none] [scrollbar-width:none] md:pr-6 lg:pr-8 [&::-webkit-scrollbar]:hidden snap-x snap-mandatory 2xl:pr-10"
    >
      <NuxtLink
        v-for="filter in filters"
        :key="filter.id"
        :to="searchLink(filter)"
        class="group relative aspect-[4/5] w-[7.25rem] shrink-0 snap-start overflow-hidden rounded-2xl ring-1 ring-black/10 sm:w-32 md:w-36 dark:ring-white/10"
        @click="onSelect(filter)"
      >
        <div
          class="absolute inset-0"
          :class="filter.imageUrl ? 'bg-stone-200 dark:bg-stone-800' : `bg-linear-to-br ${filter.tone}`"
        >
          <img
            v-if="filter.imageUrl"
            :src="filter.imageUrl"
            alt=""
            class="size-full object-cover transition duration-500 ease-out will-change-transform group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          >
          <Icon
            v-else
            :name="filter.icon"
            class="absolute left-1/2 top-[38%] size-10 -translate-x-1/2 -translate-y-1/2 text-white/90 sm:size-11"
          />
        </div>

        <div
          class="pointer-events-none absolute inset-0 shadow-[inset_0_-72px_56px_-24px_rgba(0,0,0,0.72)]"
          aria-hidden="true"
        />

        <span class="absolute inset-x-0 bottom-0 z-10 p-3 text-left text-sm font-semibold leading-tight text-white">
          {{ labelFor(filter) }}
        </span>
      </NuxtLink>
    </div>

    <button
      v-if="canScrollPrev"
      type="button"
      class="absolute left-0 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200/80 bg-white/95 text-stone-700 shadow-md backdrop-blur-sm transition hover:bg-white dark:border-stone-700 dark:bg-stone-900/95 dark:text-stone-200"
      :aria-label="t('common.carouselPrev')"
      @click="scrollByStep(-1)"
    >
      <Icon
        name="ph:caret-left-bold"
        class="size-5"
      />
    </button>

    <button
      v-if="canScrollNext"
      type="button"
      class="absolute right-4 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200/80 bg-white/95 text-stone-700 shadow-md backdrop-blur-sm transition hover:bg-white md:right-6 lg:right-8 dark:border-stone-700 dark:bg-stone-900/95 dark:text-stone-200 2xl:right-10"
      :aria-label="t('common.carouselNext')"
      @click="scrollByStep(1)"
    >
      <Icon
        name="ph:caret-right-bold"
        class="size-5"
      />
    </button>
  </div>
</template>
