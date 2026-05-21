<script setup lang="ts">
import type { ListingTeamBadgeProps } from './types'

const props = withDefaults(defineProps<ListingTeamBadgeProps>(), {
  showDescription: false,
  size: 'sm',
  overlay: false,
  bright: false,
})

const { locale } = useI18n()

const title = computed(() => (locale.value === 'en' ? props.badge.titleEn : props.badge.titleRu))
const description = computed(() =>
  locale.value === 'en' ? props.badge.descriptionEn : props.badge.descriptionRu,
)

const sizeClass = computed(() =>
  props.size === 'md'
    ? 'gap-2 px-3 py-1.5 text-sm'
    : 'gap-1.5 px-2 py-1 text-xs',
)
</script>

<template>
  <span
    class="inline-flex max-w-full items-center rounded-full border font-medium text-brand-900 dark:text-brand-100"
    :class="[
      sizeClass,
      overlay
        ? 'border-brand-200/90 bg-white/95 text-brand-900 shadow-sm ring-1 ring-black/5 backdrop-blur-sm dark:border-brand-700/80 dark:bg-stone-900/95 dark:text-brand-100 dark:ring-white/10'
        : bright
          ? 'border-brand-400 bg-brand-100 text-brand-950 shadow-sm dark:border-brand-500 dark:bg-brand-900/70 dark:text-brand-50'
          : 'border-brand-200/80 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/80',
    ]"
    :title="showDescription ? undefined : description"
  >
    <Icon
      :name="badge.icon"
      class="shrink-0"
      :class="[
        bright ? 'text-brand-800 dark:text-brand-200' : 'text-brand-700 dark:text-brand-300',
        size === 'md' ? 'size-4' : 'size-3.5',
      ]"
    />
    <span class="truncate">{{ title }}</span>
  </span>
</template>
