<script setup lang="ts">
const { t: $t } = useI18n()

const visible = ref(false)
const prefersReducedMotion = ref(true)

const updateVisibility = () => {
  visible.value = window.scrollY > 480
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion.value ? 'auto' : 'smooth',
  })
}

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  updateVisibility()
  window.addEventListener('scroll', updateVisibility, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateVisibility)
})
</script>

<template>
  <Transition name="back-to-top">
    <button
      v-show="visible"
      type="button"
      class="back-to-top-btn fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 lg:bottom-6 lg:right-6"
      :aria-label="$t('common.backToTop')"
      data-testid="back-to-top"
      @click="scrollToTop"
    >
      <Icon
        name="ph:arrow-up-bold"
        class="size-5"
        aria-hidden="true"
      />
    </button>
  </Transition>
</template>
