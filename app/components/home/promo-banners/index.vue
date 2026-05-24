<script setup lang="ts">
import type { HomePromoBannersProps } from './types'

const props = defineProps<HomePromoBannersProps>()

const hasContent = computed(() =>
  Boolean(props.section.featured) || props.section.carousel.length > 0,
)
</script>

<template>
  <section
    v-if="hasContent"
    class="border-t border-stone-200 bg-white py-8 dark:border-stone-800 dark:bg-stone-950 md:py-10"
    data-testid="home-promo-banners"
  >
    <div class="page-container">
      <div class="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <div
          v-if="section.featured"
          class="lg:col-span-2"
        >
          <HomePromoBanner
            :banner="section.featured"
            variant="featured"
          />
        </div>

        <div
          v-if="section.carousel.length"
          :class="section.featured ? 'lg:col-span-1' : 'lg:col-span-3'"
        >
          <HomePromoCarousel :banners="section.carousel" />
        </div>
      </div>
    </div>
  </section>
</template>
