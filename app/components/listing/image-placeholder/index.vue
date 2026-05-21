<script setup lang="ts">
import type { ListingImagePlaceholderProps } from './types'

withDefaults(defineProps<ListingImagePlaceholderProps>(), {
  showLabel: false,
})

const { t } = useI18n()
</script>

<template>
  <div
    class="relative flex size-full items-center justify-center overflow-hidden bg-linear-to-br from-brand-100 via-brand-50/80 to-stone-100 dark:from-brand-950 dark:via-stone-900 dark:to-stone-800"
    role="img"
    :aria-label="t('listing.noPhoto')"
  >
    <div
      class="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-brand-200/50 dark:bg-brand-800/25"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-8 -left-8 size-28 rounded-full bg-brand-300/35 dark:bg-brand-700/20"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
      aria-hidden="true"
      style="background-image: radial-gradient(circle at 1px 1px, rgb(15 118 110 / 0.15) 1px, transparent 0); background-size: 18px 18px;"
    />

    <div class="relative flex flex-col items-center gap-2 px-4 text-center">
      <div class="flex size-14 items-center justify-center rounded-2xl border border-white/60 bg-white/75 shadow-sm backdrop-blur-sm dark:border-stone-700/60 dark:bg-stone-900/70">
        <Icon
          name="ph:house-line-duotone"
          class="size-7 text-brand-600 dark:text-brand-400"
        />
      </div>
      <p
        v-if="showLabel"
        class="text-xs font-medium text-brand-700/80 dark:text-brand-300/80"
      >
        {{ t('listing.noPhoto') }}
      </p>
    </div>
  </div>
</template>
