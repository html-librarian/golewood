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

const SCROLL_EDGE = 20

let rafId = 0

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

  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth)
  canScrollPrev.value = track.scrollLeft > SCROLL_EDGE
  canScrollNext.value = maxScroll > SCROLL_EDGE && track.scrollLeft < maxScroll - SCROLL_EDGE
}

const scheduleScrollStateUpdate = () => {
  if (rafId) {
    return
  }

  rafId = requestAnimationFrame(() => {
    rafId = 0
    updateScrollState()
  })
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

onMounted(async () => {
  await nextTick()

  if (trackRef.value) {
    trackRef.value.scrollLeft = 0
  }

  updateScrollState()
  trackRef.value?.addEventListener('scroll', scheduleScrollStateUpdate, { passive: true })
  window.addEventListener('resize', scheduleScrollStateUpdate)
})

onBeforeUnmount(() => {
  trackRef.value?.removeEventListener('scroll', scheduleScrollStateUpdate)
  window.removeEventListener('resize', scheduleScrollStateUpdate)
  cancelAnimationFrame(rafId)
})

watch(() => props.filters.length, () => nextTick(updateScrollState))

const showPrevControl = computed(() => canScrollPrev.value)
const showNextControl = computed(() => canScrollNext.value)

const trackClass = computed(() => [
  'flex gap-3 overflow-x-auto scroll-smooth py-1 pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden snap-x snap-mandatory',
  !canScrollNext.value ? 'pr-4 md:pr-6' : 'pr-0',
])
</script>

<template>
  <div
    class="relative"
    data-testid="discovery-destinations-carousel"
  >
    <div
      ref="trackRef"
      :class="trackClass"
    >
      <NuxtLink
        v-for="filter in filters"
        :key="filter.id"
        :to="searchLink(filter)"
        class="destination-card group relative aspect-4/5 w-36 shrink-0 snap-start overflow-hidden rounded-2xl sm:w-40 md:w-48"
        @click="onSelect(filter)"
      >
        <div
          class="absolute inset-0 overflow-hidden rounded-2xl"
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
          <div
            class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent"
            aria-hidden="true"
          />
        </div>

        <span class="absolute inset-x-0 bottom-0 z-10 p-3 text-left text-xs font-semibold leading-none whitespace-nowrap text-white sm:text-sm">
          {{ labelFor(filter) }}
        </span>
      </NuxtLink>
    </div>

    <button
      type="button"
      class="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-md backdrop-blur-sm transition-opacity duration-200 hover:bg-white md:left-3 dark:bg-stone-900/95 dark:text-stone-200"
      :class="showPrevControl ? 'opacity-100' : 'pointer-events-none opacity-0'"
      :aria-hidden="!showPrevControl"
      :tabindex="showPrevControl ? 0 : -1"
      :aria-label="t('common.carouselPrev')"
      @click="scrollByStep(-1)"
    >
      <Icon
        name="ph:caret-left-bold"
        class="size-5"
      />
    </button>

    <button
      type="button"
      class="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-md backdrop-blur-sm transition-opacity duration-200 hover:bg-white md:right-3 dark:bg-stone-900/95 dark:text-stone-200"
      :class="showNextControl ? 'opacity-100' : 'pointer-events-none opacity-0'"
      :aria-hidden="!showNextControl"
      :tabindex="showNextControl ? 0 : -1"
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
