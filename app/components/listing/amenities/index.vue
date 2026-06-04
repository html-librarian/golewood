<script setup lang="ts">
import type { AmenityCatalogItem } from '#shared/types/catalog'
import { AMENITY_LABELS } from '#shared/types/listing'
import { resolveAmenityIcon } from '#shared/utils/amenity-icon'
import type { ListingAmenitiesProps } from './types'

defineProps<ListingAmenitiesProps>()
const { locale } = useI18n()
const { fetchAmenities } = useCatalog()

const { data: catalog } = await useAsyncData('amenity-catalog', () => fetchAmenities())

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
  resolveAmenityIcon(catalogBySlug.value.get(slug)?.icon)
</script>

<template>
  <ul class="flex flex-wrap gap-2">
    <li
      v-for="amenity in amenities"
      :key="amenity"
      class="chip chip-inactive inline-flex items-center gap-1.5"
    >
      <Icon
        :name="iconFor(amenity)"
        class="chip-icon"
      />
      {{ labelFor(amenity) }}
    </li>
  </ul>
</template>
