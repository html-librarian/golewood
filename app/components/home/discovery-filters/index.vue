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

      <ul class="grid grid-cols-3 gap-x-3 gap-y-7 sm:grid-cols-4 sm:gap-x-5 sm:gap-y-8 md:gap-x-6">
        <li
          v-for="filter in group.filters"
          :key="filter.id"
        >
          <NuxtLink
            :to="searchLink(filter)"
            class="group flex flex-col items-center gap-2.5 text-center sm:gap-3"
            @click="onSelect(filter)"
          >
            <span
              class="flex size-24 items-center justify-center overflow-hidden rounded-full shadow-md ring-1 ring-black/10 transition group-hover:scale-105 group-hover:shadow-lg sm:size-28 md:size-32"
              :class="filter.imageUrl ? 'bg-stone-200 dark:bg-stone-800' : `bg-linear-to-br text-white ${filter.tone}`"
            >
              <img
                v-if="filter.imageUrl"
                :src="filter.imageUrl"
                alt=""
                class="size-full object-cover"
              >
              <Icon
                v-else
                :name="filter.icon"
                class="size-11 sm:size-12 md:size-14"
              />
            </span>
            <span class="max-w-[6.5rem] text-xs font-medium leading-snug text-stone-700 group-hover:text-brand-700 sm:max-w-none sm:text-sm dark:text-stone-300 dark:group-hover:text-brand-300">
              {{ labelFor(filter) }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>
