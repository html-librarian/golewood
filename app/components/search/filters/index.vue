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

const FILTER_SECTION_PREVIEW = 5

const expandedSections = ref<Set<string>>(new Set())

const isSectionExpanded = (sectionKey: string) => expandedSections.value.has(sectionKey)

const toggleSection = (sectionKey: string) => {
  const next = new Set(expandedSections.value)

  if (next.has(sectionKey)) {
    next.delete(sectionKey)
  } else {
    next.add(sectionKey)
  }

  expandedSections.value = next
}

const sectionHasMore = (count: number) => count > FILTER_SECTION_PREVIEW

const visibleSectionItems = <T,>(
  sectionKey: string,
  items: T[],
  isSelected: (item: T) => boolean,
  itemKey: (item: T) => string,
) => {
  if (isSectionExpanded(sectionKey) || items.length <= FILTER_SECTION_PREVIEW) {
    return items
  }

  const preview = items.slice(0, FILTER_SECTION_PREVIEW)
  const previewKeys = new Set(preview.map(itemKey))
  const selectedHidden = items.filter(item => isSelected(item) && !previewKeys.has(itemKey(item)))

  return [...preview, ...selectedHidden]
}

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

const amenitySectionKey = (category: AmenityCategory) => `amenity:${category}`

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
          v-for="badge in visibleSectionItems('team-badges', teamBadges, b => teamBadgeSlugs.includes(b.slug), b => b.slug)"
          :key="badge.id"
        >
          <FormCheckbox
            :model-value="teamBadgeSlugs.includes(badge.slug)"
            @update:model-value="toggleTeamBadge(badge.slug)"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span class="flex size-4 shrink-0 items-center justify-center">
                <Icon
                  :name="badge.icon"
                  class="size-4 text-brand-700 dark:text-brand-400"
                />
              </span>
              <span class="min-w-0">{{ badgeLabel(badge.slug, badge.titleRu, badge.titleEn) }}</span>
            </span>
          </FormCheckbox>
        </li>
      </ul>
      <UiButton
        v-if="teamBadges && sectionHasMore(teamBadges.length)"
        type="button"
        variant="outline"
        size="sm"
        class="w-full"
        @click="toggleSection('team-badges')"
      >
        {{ isSectionExpanded('team-badges') ? $t('search.showLess') : $t('search.showMore') }}
      </UiButton>
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
          v-for="item in visibleSectionItems(
            'accommodation-types',
            accommodationTypeCatalog,
            i => accommodationTypes.includes(i.slug),
            i => i.slug,
          )"
          :key="item.slug"
        >
          <FormCheckbox
            :model-value="accommodationTypes.includes(item.slug)"
            @update:model-value="toggleAccommodationType(item.slug)"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span class="flex size-4 shrink-0 items-center justify-center">
                <Icon
                  :name="item.icon"
                  class="size-4 text-brand-700 dark:text-brand-400"
                />
              </span>
              <span class="min-w-0">{{ accommodationLabel(item) }}</span>
            </span>
          </FormCheckbox>
        </li>
      </ul>
      <UiButton
        v-if="accommodationTypeCatalog && sectionHasMore(accommodationTypeCatalog.length)"
        type="button"
        variant="outline"
        size="sm"
        class="w-full"
        @click="toggleSection('accommodation-types')"
      >
        {{ isSectionExpanded('accommodation-types') ? $t('search.showLess') : $t('search.showMore') }}
      </UiButton>
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
          v-for="amenity in visibleSectionItems(
            amenitySectionKey(group.category),
            group.items,
            a => amenities.includes(a.slug),
            a => a.slug,
          )"
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
        v-if="sectionHasMore(group.items.length)"
        type="button"
        variant="outline"
        size="sm"
        class="w-full"
        @click="toggleSection(amenitySectionKey(group.category))"
      >
        {{ isSectionExpanded(amenitySectionKey(group.category)) ? $t('search.showLess') : $t('search.showMore') }}
      </UiButton>
    </div>
  </aside>
</template>
