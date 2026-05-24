<script setup lang="ts">
import type { HomeDiscoveryFilter } from '#shared/catalog/home-discovery'
import { buildSearchRouteQuery } from '#shared/utils/search-query'
import type { HomeDiscoveryFilterGridEmits, HomeDiscoveryFilterGridProps } from './types'

const { filters } = defineProps<HomeDiscoveryFilterGridProps>()
const emit = defineEmits<HomeDiscoveryFilterGridEmits>()

const { locale } = useI18n()
const localePath = useLocalePath()
const { setCity } = useUserCity()

const labelFor = (filter: HomeDiscoveryFilter) =>
  locale.value === 'en' ? filter.labelEn : filter.labelRu

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
  <ul
    class="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4 md:gap-x-4 md:gap-y-6 lg:grid-cols-8"
    data-testid="discovery-filter-grid"
  >
    <li
      v-for="filter in filters"
      :key="filter.id"
    >
      <NuxtLink
        :to="searchLink(filter)"
        class="group flex flex-col gap-2"
        @click="onSelect(filter)"
      >
        <span
          class="relative aspect-square w-full rounded-2xl shadow-sm ring-1 ring-black/10 transition group-hover:shadow-md dark:ring-white/10"
        >
          <span
            class="absolute inset-0 overflow-hidden rounded-2xl"
            :class="filter.imageUrl ? 'bg-stone-200 dark:bg-stone-800' : `bg-linear-to-br text-white ${filter.tone}`"
          >
            <img
              v-if="filter.imageUrl"
              :src="filter.imageUrl"
              alt=""
              class="size-full object-cover transition duration-500 ease-out will-change-transform group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            >
            <Icon
              v-else
              :name="filter.icon"
              class="absolute left-1/2 top-1/2 z-[1] size-8 -translate-x-1/2 -translate-y-1/2 sm:size-9"
            />
          </span>
          <span
            class="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_-72px_56px_-24px_rgba(0,0,0,0.72)]"
            aria-hidden="true"
          />
        </span>
        <span class="line-clamp-2 text-center text-xs font-medium leading-snug text-stone-700 group-hover:text-brand-700 sm:text-sm dark:text-stone-300 dark:group-hover:text-brand-300">
          {{ labelFor(filter) }}
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>
