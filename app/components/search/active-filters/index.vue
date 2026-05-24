<script setup lang="ts">
import { buildSearchActiveFilterTags } from '#shared/utils/search-active-filters'
import type { SearchActiveFilterTag, SearchActiveFiltersEmits, SearchActiveFiltersProps } from './types'

const props = defineProps<SearchActiveFiltersProps>()
const emit = defineEmits<SearchActiveFiltersEmits>()

const { locale, t } = useI18n()
const { fetchAmenities, fetchAccommodationTypes } = useCatalog()
const { fetchTeamBadges } = useTeamBadges()

const { data: amenityCatalog } = await useAsyncData('search-amenities', () => fetchAmenities())
const { data: accommodationTypeCatalog } = await useAsyncData('search-accommodation-types', () => fetchAccommodationTypes())
const { data: teamBadges } = await useAsyncData('search-team-badges', () => fetchTeamBadges())

const teamBadgeCatalog = computed(() =>
  (teamBadges.value ?? []).map(badge => ({
    slug: badge.slug,
    labelRu: badge.titleRu,
    labelEn: badge.titleEn,
  })),
)

const tags = computed(() => buildSearchActiveFilterTags({
  minPrice: props.minPrice,
  maxPrice: props.maxPrice,
  amenities: props.amenities,
  accommodationTypes: props.accommodationTypes,
  teamBadgeSlugs: props.teamBadgeSlugs,
  amenityCatalog: amenityCatalog.value ?? [],
  accommodationCatalog: accommodationTypeCatalog.value ?? [],
  teamBadgeCatalog: teamBadgeCatalog.value,
  locale: locale.value,
  priceFromLabel: price => t('search.filterPriceFrom', { price }),
  priceToLabel: price => t('search.filterPriceTo', { price }),
  priceRangeLabel: (min, max) => t('search.filterPriceRange', { min, max }),
}))

const onRemove = (tag: SearchActiveFilterTag) => {
  emit('remove', tag)
}
</script>

<template>
  <ul
    v-if="tags.length"
    class="flex flex-wrap gap-2"
    data-testid="search-active-filters"
  >
    <li
      v-for="tag in tags"
      :key="tag.key"
    >
      <span
        class="inline-flex max-w-full items-center gap-1 rounded-full border border-brand-200/80 bg-brand-50 py-1 pl-2.5 pr-1 text-xs font-medium text-brand-900 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-100"
      >
        <span class="truncate">{{ tag.label }}</span>
        <button
          type="button"
          class="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-brand-700 transition hover:bg-brand-100 hover:text-brand-900 dark:text-brand-300 dark:hover:bg-brand-900 dark:hover:text-brand-50"
          :aria-label="t('search.removeFilter', { label: tag.label })"
          :data-testid="`search-active-filter-remove-${tag.key}`"
          @click="onRemove(tag)"
        >
          <Icon
            name="ph:x-bold"
            class="size-3.5"
          />
        </button>
      </span>
    </li>
  </ul>
</template>
