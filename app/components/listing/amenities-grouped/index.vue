<script setup lang="ts">
import type { AmenityCatalogItem } from '#shared/types/catalog'
import type { AmenityCategory } from '#shared/catalog/amenity-categories'
import { AMENITY_CATEGORY_LABELS, AMENITY_CATEGORY_ORDER } from '#shared/catalog/amenity-categories'
import { AMENITY_LABELS } from '#shared/types/listing'
import type { ListingAmenitiesGroupedProps } from './types'

const props = defineProps<ListingAmenitiesGroupedProps>()
const { locale } = useI18n()
const { fetchAmenities } = useCatalog()

const { data: catalog } = await useAsyncData('amenity-catalog-grouped', () => fetchAmenities())

const CATEGORY_ICONS: Record<AmenityCategory, string> = {
  location: 'ph:map-pin-duotone',
  outdoor: 'ph:tree-duotone',
  activities: 'ph:basketball-duotone',
  kitchen: 'ph:cooking-pot-duotone',
  kids: 'ph:baby-duotone',
  comfort: 'ph:couch-duotone',
  rules: 'ph:clipboard-text-duotone',
  view: 'ph:mountains-duotone',
  bathroom: 'ph:bathtub-duotone',
  extras: 'ph:sparkle-duotone',
}

const catalogBySlug = computed(() => {
  const map = new Map<string, AmenityCatalogItem>()

  for (const item of catalog.value ?? []) {
    map.set(item.slug, item)
  }

  return map
})

const labelFor = (slug: string) => {
  const item = catalogBySlug.value.get(slug)

  if (item) {
    return locale.value === 'en' ? item.labelEn : item.labelRu
  }

  const legacy = AMENITY_LABELS[slug as keyof typeof AMENITY_LABELS]
  return legacy?.[locale.value as 'ru' | 'en'] ?? slug
}

const iconFor = (slug: string) =>
  catalogBySlug.value.get(slug)?.icon ?? 'ph:check-circle-duotone'

const groupedSections = computed(() => {
  const byCategory = new Map<AmenityCategory, string[]>()

  for (const slug of props.amenities) {
    const category = catalogBySlug.value.get(slug)?.category ?? 'comfort'

    const list = byCategory.get(category) ?? []
    list.push(slug)
    byCategory.set(category, list)
  }

  return AMENITY_CATEGORY_ORDER
    .filter(category => (byCategory.get(category)?.length ?? 0) > 0)
    .map(category => ({
      category,
      icon: CATEGORY_ICONS[category],
      title: locale.value === 'en'
        ? AMENITY_CATEGORY_LABELS[category].en
        : AMENITY_CATEGORY_LABELS[category].ru,
      items: byCategory.get(category) ?? [],
    }))
})
</script>

<template>
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    <section
      v-for="section in groupedSections"
      :key="section.category"
      class="min-w-0"
    >
      <h3 class="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-50">
        <Icon
          :name="section.icon"
          class="size-4 shrink-0 text-brand-600 dark:text-brand-400"
        />
        {{ section.title }}
      </h3>
      <ul class="mt-3 space-y-2">
        <li
          v-for="slug in section.items"
          :key="slug"
          class="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300"
        >
          <Icon
            :name="iconFor(slug)"
            class="mt-0.5 size-4 shrink-0 text-stone-400 dark:text-stone-500"
          />
          <span>{{ labelFor(slug) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
