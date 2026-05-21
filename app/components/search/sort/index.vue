<script setup lang="ts">
import { SEARCH_SORTS, type SearchSort } from '#shared/types/search'
import type { SearchSortEmits, SearchSortProps } from './types'

const props = defineProps<SearchSortProps>()
const emit = defineEmits<SearchSortEmits>()
const { t } = useI18n()

const sortOptions = computed(() => [
  { value: '', label: t('search.sort.default') },
  ...SEARCH_SORTS.map(value => ({
    value,
    label: t(`search.sort.${value}`),
  })),
])
</script>

<template>
  <FormSelect
    :model-value="props.modelValue"
    :options="sortOptions"
    :label="$t('search.sortLabel')"
    class="w-full sm:max-w-xs"
    data-testid="search-sort"
    @update:model-value="emit('update:modelValue', $event as SearchSort | '')"
  />
</template>
