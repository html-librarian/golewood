<script setup lang="ts">
import type { ListingTeamBadgeLinkProps } from './types'

const props = withDefaults(defineProps<ListingTeamBadgeLinkProps>(), {
  size: 'md',
})

const { locale } = useI18n()

const description = computed(() =>
  locale.value === 'en' ? props.badge.descriptionEn : props.badge.descriptionRu,
)
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    class="group relative shrink-0"
    :class="to ? 'rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:focus-visible:outline-brand-400' : ''"
  >
    <ListingTeamBadge
      :badge="badge"
      :size="size"
      bright
      :class="to ? 'transition group-hover:border-brand-500 group-hover:bg-brand-200/90 group-hover:shadow-md dark:group-hover:border-brand-400 dark:group-hover:bg-brand-800/90' : ''"
    />
    <span
      role="tooltip"
      class="pointer-events-none absolute right-0 top-full z-30 mt-2 hidden w-64 max-w-[min(16rem,calc(100vw-2rem))] rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs leading-relaxed text-stone-700 shadow-lg group-hover:block group-focus-within:block dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
    >
      {{ description }}
    </span>
  </component>
</template>
