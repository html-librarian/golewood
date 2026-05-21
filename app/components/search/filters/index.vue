<script setup lang="ts">
import type { AmenityCatalogItem } from '#shared/types/catalog'
import {
  AMENITY_CATEGORY_LABELS,
  AMENITY_CATEGORY_ORDER,
  type AmenityCategory,
} from '#shared/catalog/amenity-categories'
import type { SearchFiltersEmits, SearchFiltersProps } from './types'

const props = defineProps<SearchFiltersProps>()
const emit = defineEmits<SearchFiltersEmits>()
const { locale } = useI18n()
const { fetchAmenities, fetchAccommodationTypes } = useCatalog()
const { fetchTeamBadges } = useTeamBadges()

const { data: amenityCatalog } = await useAsyncData('search-amenities', () => fetchAmenities())
const { data: accommodationTypeCatalog } = await useAsyncData('search-accommodation-types', () => fetchAccommodationTypes())
const { data: teamBadges } = await useAsyncData('search-team-badges', () => fetchTeamBadges())

const COMFORT_PREVIEW = 6
const expandedComfort = ref(false)

const amenityLabel = (item: AmenityCatalogItem) =>
  locale.value === 'en' ? item.labelEn : item.labelRu

const categoryLabel = (category: AmenityCategory) => {
  const labels = AMENITY_CATEGORY_LABELS[category]
  return locale.value === 'en' ? labels.en : labels.ru
}

const groupedAmenities = computed(() => {
  const items = amenityCatalog.value ?? []
  const byCategory = new Map<AmenityCategory, AmenityCatalogItem[]>()

  for (const category of AMENITY_CATEGORY_ORDER) {
    byCategory.set(category, [])
  }

  for (const item of items) {
    const list = byCategory.get(item.category) ?? byCategory.get('comfort')!
    list.push(item)
  }

  return AMENITY_CATEGORY_ORDER
    .map(category => ({ category, items: byCategory.get(category) ?? [] }))
    .filter(group => group.items.length > 0)
})

const visibleComfortItems = (items: AmenityCatalogItem[]) => {
  if (expandedComfort.value || items.length <= COMFORT_PREVIEW) {
    return items
  }

  return items.slice(0, COMFORT_PREVIEW)
}

const accommodationLabel = (item: { slug: string, labelRu: string, labelEn: string }) =>
  locale.value === 'en' ? item.labelEn : item.labelRu

const toggleAccommodationType = (slug: string) => {
  const next = props.accommodationTypes.includes(slug)
    ? props.accommodationTypes.filter(item => item !== slug)
    : [...props.accommodationTypes, slug]

  emit('update:accommodationTypes', next)
}

const toggleAmenity = (slug: string) => {
  const next = props.amenities.includes(slug)
    ? props.amenities.filter(item => item !== slug)
    : [...props.amenities, slug]

  emit('update:amenities', next)
}

const badgeLabel = (slug: string, titleRu: string, titleEn: string) =>
  locale.value === 'en' ? titleEn : titleRu

const toggleTeamBadge = (slug: string) => {
  const next = props.teamBadgeSlugs.includes(slug)
    ? props.teamBadgeSlugs.filter(item => item !== slug)
    : [...props.teamBadgeSlugs, slug]

  emit('update:teamBadgeSlugs', next)
}
</script>

<template>
  <aside class="space-y-5 border-stone-200 lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto lg:border-r lg:pr-6 dark:border-stone-800">
    <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
      {{ $t('search.filters') }}
    </h2>

    <FormRange
      :min-value="minPrice"
      :max-value="maxPrice"
      :label="`${$t('search.minPrice')} — ${$t('search.maxPrice')}`"
      :floor="0"
      :ceiling="30000"
      :step="500"
      @update:min-value="emit('update:minPrice', $event)"
      @update:max-value="emit('update:maxPrice', $event)"
    />

    <div
      v-if="teamBadges?.length"
      class="space-y-2 border-t border-stone-200 pt-4 dark:border-stone-800"
    >
      <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">
        {{ $t('search.teamBadges') }}
      </p>
      <ul class="space-y-2">
        <li
          v-for="badge in teamBadges"
          :key="badge.id"
        >
          <FormCheckbox
            :model-value="teamBadgeSlugs.includes(badge.slug)"
            @update:model-value="toggleTeamBadge(badge.slug)"
          >
            <span class="inline-flex min-w-0 items-center gap-1.5">
              <Icon
                :name="badge.icon"
                class="size-4 shrink-0 text-brand-700 dark:text-brand-400"
              />
              <span>{{ badgeLabel(badge.slug, badge.titleRu, badge.titleEn) }}</span>
            </span>
          </FormCheckbox>
        </li>
      </ul>
    </div>

    <div
      v-if="accommodationTypeCatalog?.length"
      class="space-y-2 border-t border-stone-200 pt-4 dark:border-stone-800"
    >
      <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">
        {{ $t('search.accommodationTypes') }}
      </p>
      <ul class="space-y-2">
        <li
          v-for="item in accommodationTypeCatalog"
          :key="item.slug"
        >
          <FormCheckbox
            :model-value="accommodationTypes.includes(item.slug)"
            @update:model-value="toggleAccommodationType(item.slug)"
          >
            <span class="inline-flex min-w-0 items-center gap-1.5">
              <Icon
                :name="item.icon"
                class="size-4 shrink-0 text-brand-700 dark:text-brand-400"
              />
              <span>{{ accommodationLabel(item) }}</span>
            </span>
          </FormCheckbox>
        </li>
      </ul>
    </div>

    <div
      v-for="group in groupedAmenities"
      :key="group.category"
      class="space-y-2 border-t border-stone-200 pt-4 first:border-t-0 first:pt-0 dark:border-stone-800"
    >
      <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">
        {{ categoryLabel(group.category) }}
      </p>

      <ul class="space-y-2">
        <li
          v-for="amenity in group.category === 'comfort' ? visibleComfortItems(group.items) : group.items"
          :key="amenity.slug"
        >
          <FormCheckbox
            :model-value="amenities.includes(amenity.slug)"
            :label="amenityLabel(amenity)"
            @update:model-value="toggleAmenity(amenity.slug)"
          />
        </li>
      </ul>

      <UiButton
        v-if="group.category === 'comfort' && group.items.length > COMFORT_PREVIEW"
        type="button"
        variant="outline"
        size="sm"
        class="w-full"
        @click="expandedComfort = !expandedComfort"
      >
        {{ expandedComfort ? $t('search.showLess') : $t('search.showMore') }}
      </UiButton>
    </div>
  </aside>
</template>
