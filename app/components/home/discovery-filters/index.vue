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
    class="discovery-panel surface-card divide-y divide-stone-100 dark:divide-stone-800"
    :aria-label="$t('common.discoveryQuickSearch')"
  >
    <div
      v-for="group in groups"
      :key="group.id"
      class="px-4 py-6 md:px-6 md:py-7"
    >
      <h3
        class="editorial-kicker editorial-kicker-leaf mb-4 md:mb-5"
        :class="group.id === 'destinations' ? 'text-left' : 'text-center'"
      >
        {{ titleFor(group) }}
      </h3>

      <div
        v-if="group.id === 'destinations'"
        class="-mr-4 bleed-viewport-right md:-mr-6"
      >
        <HomeDiscoveryDestinationsCarousel
          :filters="sortedDestinations(group.filters)"
          @select="onSelect"
        />
      </div>

      <HomeDiscoveryFilterGrid
        v-else
        variant="chips"
        :filters="group.filters"
        @select="onSelect"
      />
    </div>
  </section>
</template>
