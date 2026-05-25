<script setup lang="ts">
import { getListingSourceAttributionText } from '#shared/utils/listing-source-attribution'
import type { ListingSourceFootnoteProps } from './types'

const props = defineProps<ListingSourceFootnoteProps>()

const { locale } = useI18n()

const sourceText = computed(() =>
  getListingSourceAttributionText(props.listing, locale.value === 'en' ? 'en' : 'ru'),
)

const footnote = computed(() => {
  if (!sourceText.value) {
    return null
  }

  return locale.value === 'en'
    ? `Materials and description are based on information from the following source: ${sourceText.value}.`
    : `Материалы и описание размещены на основе информации из следующего источника: ${sourceText.value}.`
})
</script>

<template>
  <p
    v-if="footnote"
    class="text-xs leading-relaxed text-stone-500 dark:text-stone-400"
    data-testid="listing-source-footnote"
  >
    <span
      class="mr-0.5 font-medium text-stone-600 dark:text-stone-300"
      aria-hidden="true"
    >*</span>
    {{ footnote }}
  </p>
</template>
