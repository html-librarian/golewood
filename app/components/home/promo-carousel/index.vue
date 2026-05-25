<script setup lang="ts">
import type { HomePromoCarouselProps } from './types'

const props = defineProps<HomePromoCarouselProps>()

const activeIndex = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

const goTo = (index: number) => {
  if (!props.banners.length) {
    return
  }

  activeIndex.value = ((index % props.banners.length) + props.banners.length) % props.banners.length
}

const restartTimer = () => {
  if (!import.meta.client || props.banners.length < 2) {
    return
  }

  clearInterval(timer)
  timer = setInterval(() => {
    goTo(activeIndex.value + 1)
  }, 6000)
}

onMounted(() => {
  restartTimer()
})

onBeforeUnmount(() => {
  clearInterval(timer)
})

watch(() => props.banners.length, () => {
  activeIndex.value = 0
  restartTimer()
})
</script>

<template>
  <div
    class="relative size-full min-h-44 sm:min-h-48 lg:min-h-60"
    data-testid="home-promo-carousel"
  >
    <Transition
      mode="out-in"
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <HomePromoBanner
        :key="banners[activeIndex]?.id"
        :banner="banners[activeIndex]!"
        variant="carousel"
      />
    </Transition>

    <div
      v-if="banners.length > 1"
      class="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5"
    >
      <button
        v-for="(banner, index) in banners"
        :key="banner.id"
        type="button"
        class="pointer-events-auto size-2 rounded-full transition"
        :class="index === activeIndex ? 'bg-white' : 'bg-white/45 hover:bg-white/70'"
        :aria-label="`Slide ${index + 1}`"
        @click="goTo(index); restartTimer()"
      />
    </div>
  </div>
</template>
