<script setup lang="ts">
import type { HomeDiscoveryFilter } from '#shared/catalog/home-discovery'
import { buildSearchRouteQuery } from '#shared/utils/search-query'
import type { HomeDiscoveryFiltersEmits, HomeDiscoveryFiltersProps } from './types'

const { groups } = defineProps<HomeDiscoveryFiltersProps>()
const emit = defineEmits<HomeDiscoveryFiltersEmits>()

const { locale } = useI18n()
const localePath = useLocalePath()
const { setCity } = useUserCity()

const labelFor = (filter: HomeDiscoveryFilter) =>
  locale.value === 'en' ? filter.labelEn : filter.labelRu

const titleFor = (group: HomeDiscoveryFiltersProps['groups'][number]) =>
  locale.value === 'en' ? group.titleEn : group.titleRu

const searchLink = (filter: HomeDiscoveryFilter) =>
  localePath({
    path: '/search',
    query: buildSearchRouteQuery(filter.params),
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

      <ul class="grid grid-cols-4 gap-x-2 gap-y-5 sm:gap-x-4 sm:gap-y-6">
        <li
          v-for="filter in group.filters"
          :key="filter.id"
        >
          <NuxtLink
            :to="searchLink(filter)"
            class="group flex flex-col items-center gap-2 text-center"
            @click="onSelect(filter)"
          >
            <span
              class="flex size-14 items-center justify-center rounded-full bg-linear-to-br text-white shadow-sm ring-1 ring-black/5 transition group-hover:scale-105 group-hover:shadow-md sm:size-16"
              :class="filter.tone"
            >
              <Icon
                :name="filter.icon"
                class="size-7 sm:size-8"
              />
            </span>
            <span class="text-xs font-medium leading-snug text-stone-700 group-hover:text-brand-700 dark:text-stone-300 dark:group-hover:text-brand-300 sm:text-sm">
              {{ labelFor(filter) }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>
