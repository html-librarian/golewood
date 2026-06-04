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
    class="flex flex-col gap-4 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-brand-800 dark:bg-brand-950/50"
  >
    <div class="flex min-w-0 items-center gap-3">
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300"
        aria-hidden="true"
      >
        <Icon
          name="ph:calendar-blank-duotone"
          class="size-5"
        />
      </span>
      <div class="min-w-0">
        <p class="font-semibold text-stone-900 dark:text-stone-50">
          {{ t('title') }}
        </p>
        <p class="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
          {{ t('subtitle') }}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
      <p class="text-sm font-semibold tabular-nums text-stone-900 dark:text-stone-100">
        {{ t('fromPrice', { price: formatPrice(pricePerNight) }) }}
        <span class="font-normal text-stone-500 dark:text-stone-400">{{ t('perNight') }}</span>
      </p>
      <UiButton
        type="button"
        class="w-full shrink-0 sm:w-auto"
        @click="emit('selectDates')"
      >
        {{ t('action') }}
      </UiButton>
    </div>
  </div>
</template>
