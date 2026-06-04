<script setup lang="ts">
import type { ListingSpotlightPromptProps } from './types'
import ru from './i18n/ru'
import en from './i18n/en'

defineProps<ListingSpotlightPromptProps>()

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(`/spotlight?listingId=${listingId}`)"
    class="spotlight-prompt group"
  >
    <span
      class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
      aria-hidden="true"
    >
      <Icon
        name="ph:camera-duotone"
        class="size-5"
      />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block font-semibold text-stone-900 dark:text-stone-50">
        {{ t('title') }}
      </span>
      <span class="mt-0.5 block text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </span>
    </span>
    <span class="hidden shrink-0 text-sm font-semibold text-brand-700 sm:inline dark:text-brand-400">
      {{ t('action') }}
    </span>
    <Icon
      name="ph:arrow-right"
      class="size-4 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700 dark:group-hover:text-brand-400"
      aria-hidden="true"
    />
  </NuxtLink>
</template>
