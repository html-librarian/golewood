<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import type { ListingDatesPromptEmits, ListingDatesPromptProps } from './types'
import ru from './i18n/ru'
import en from './i18n/en'

defineProps<ListingDatesPromptProps>()
const emit = defineEmits<ListingDatesPromptEmits>()

const { t } = usePageI18n({ ru, en })
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-2xl border border-accent-200/80 bg-accent-50/80 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-accent-900/50 dark:bg-accent-950/30"
  >
    <div class="flex min-w-0 items-start gap-3">
      <span
        class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-accent-600 shadow-sm dark:bg-stone-900 dark:text-accent-400"
        aria-hidden="true"
      >
        <Icon
          name="ph:calendar-blank-duotone"
          class="size-6"
        />
      </span>
      <div class="min-w-0">
        <p class="font-semibold text-stone-900 dark:text-stone-50">
          {{ t('title') }}
        </p>
        <p class="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
          {{ t('subtitle') }}
        </p>
        <p class="mt-2 text-sm font-medium text-stone-800 dark:text-stone-200">
          {{ t('fromPrice', { price: formatPrice(pricePerNight) }) }}
          <span class="font-normal text-stone-500 dark:text-stone-400"> {{ t('perNight') }}</span>
        </p>
      </div>
    </div>

    <UiButton
      type="button"
      class="w-full shrink-0 sm:w-auto"
      @click="emit('selectDates')"
    >
      {{ t('action') }}
    </UiButton>
  </div>
</template>
