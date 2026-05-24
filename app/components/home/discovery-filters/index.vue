<script setup lang="ts">
import type { HomeDiscoveryFilter } from '#shared/catalog/home-discovery'
import { sortDiscoveryDestinations } from '#shared/utils/discovery-destinations-sort'
import type { HomeDiscoveryFiltersEmits, HomeDiscoveryFiltersProps } from './types'

const { groups } = defineProps<HomeDiscoveryFiltersProps>()
const emit = defineEmits<HomeDiscoveryFiltersEmits>()

const { locale } = useI18n()
const { setCity, city: cookieCity, source: citySource } = useUserCity()
const { user } = useAuth()

const titleFor = (group: HomeDiscoveryFiltersProps['groups'][number]) =>
  locale.value === 'en' ? group.titleEn : group.titleRu

const sortedDestinations = (filters: HomeDiscoveryFilter[]) =>
  sortDiscoveryDestinations(filters, {
    geoCity: citySource.value === 'geo' ? cookieCity.value : null,
    profileCity: user.value?.homeCity ?? null,
  })

const onSelect = (filter: HomeDiscoveryFilter) => {
  if (filter.params.city) {
    setCity(filter.params.city, 'manual')
  }

  emit('select', filter)
}
</script>

<template>
  <section
    class="space-y-8"
    aria-label="Quick search"
  >
    <div
      v-for="(group, groupIndex) in groups"
      :key="group.id"
      class="space-y-4"
      :class="groupIndex > 0 ? 'border-t border-stone-200 pt-8 dark:border-stone-800' : ''"
    >
      <h2 class="text-center text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {{ titleFor(group) }}
      </h2>

      <div
        v-if="group.id === 'destinations'"
        class="bleed-viewport-right"
      >
        <HomeDiscoveryDestinationsCarousel
          :filters="sortedDestinations(group.filters)"
          @select="onSelect"
        />
      </div>

      <HomeDiscoveryFilterGrid
        v-else
        :filters="group.filters"
        @select="onSelect"
      />
    </div>
  </section>
</template>
