<script setup lang="ts">
import type { Amenity } from '#shared/types/listing'
import type { SearchParams, SearchSort } from '#shared/types/search'
import type { SearchActiveFilterTag } from '#shared/utils/search-active-filters'
import {
  buildSearchRouteQuery,
  normalizeSearchPage,
  parseSearchParamsFromRoute,
  searchFilterCacheKey,
  searchParamsCacheKey,
} from '#shared/utils/search-query'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t } = usePageI18n({ ru, en })
const { t: $t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { search } = useSearch()
const { city: preferredCity, isGeoDefault, setCity, clearCity } = useUserCity()

useSiteSeo({
  title: $t('seo.searchTitle'),
  description: $t('seo.defaultDescription'),
})

const loading = ref(false)
const activeId = ref<string | null>(null)

const applyRouteToForm = (params: SearchParams) => {
  form.city = params.city ?? ''
  form.checkIn = params.checkIn ?? ''
  form.checkOut = params.checkOut ?? ''
  form.guests = params.guests !== undefined ? String(params.guests) : '2'
  form.minPrice = params.minPrice !== undefined ? String(params.minPrice) : ''
  form.maxPrice = params.maxPrice !== undefined ? String(params.maxPrice) : ''
  form.sort = params.sort ?? ''
  form.amenities = (params.amenities ?? []) as Amenity[]
  form.accommodationTypes = [...(params.accommodationTypes ?? [])]
  form.teamBadgeSlugs = [...(params.teamBadgeSlugs ?? [])]
}

const routeSearchParams = computed(() =>
  parseSearchParamsFromRoute(route.query as Record<string, unknown>),
)

const routeSearchKey = computed(() => searchParamsCacheKey(routeSearchParams.value))

const form = reactive({
  city: '',
  checkIn: '',
  checkOut: '',
  guests: '2',
  minPrice: '',
  maxPrice: '',
  sort: '' as SearchSort | '',
  amenities: [] as Amenity[],
  accommodationTypes: [] as string[],
  teamBadgeSlugs: [] as string[],
})

applyRouteToForm(routeSearchParams.value)

watch(routeSearchParams, (params) => {
  applyRouteToForm(params)
})

const cityHint = computed(() => {
  if (!isGeoDefault.value || !form.city) {
    return undefined
  }

  return $t('form.cityDefaultHint', { city: form.city })
})

const onCityChange = async (value: string) => {
  form.city = value

  if (value) {
    setCity(value, 'manual')
    return
  }

  clearCity()

  if (routeSearchParams.value.city) {
    await runSearch()
  }
}

const { data: results, error: searchError, pending } = await useAsyncData(
  () => `search-${routeSearchKey.value}`,
  () => search(routeSearchParams.value),
  { watch: [routeSearchKey] },
)

const showSkeleton = computed(() => pending.value || loading.value)

const searchErrorMessage = computed(() => {
  if (!searchError.value) {
    return ''
  }

  const statusCode = (searchError.value as { statusCode?: number }).statusCode

  if (statusCode === 400) {
    return t('searchErrorValidation')
  }

  return import.meta.dev ? t('searchErrorDev') : t('searchError')
})

const formToSearchParams = (page = 1): SearchParams => ({
  city: form.city || undefined,
  checkIn: form.checkIn || undefined,
  checkOut: form.checkOut || undefined,
  guests: form.guests ? Number(form.guests) : undefined,
  minPrice: form.minPrice ? Number(form.minPrice) : undefined,
  maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
  sort: form.sort || undefined,
  amenities: form.amenities.length ? form.amenities : undefined,
  accommodationTypes: form.accommodationTypes.length ? form.accommodationTypes : undefined,
  teamBadgeSlugs: form.teamBadgeSlugs.length ? form.teamBadgeSlugs : undefined,
  page: normalizeSearchPage(page),
  pageSize: routeSearchParams.value.pageSize,
})

const currentPage = computed(() => routeSearchParams.value.page ?? 1)

const totalPages = computed(() => {
  const total = results.value?.total ?? 0
  const pageSize = results.value?.pageSize ?? 12

  return Math.max(1, Math.ceil(total / pageSize))
})

const pushSearchRoute = async (params: SearchParams) => {
  await navigateTo({
    path: localePath('/search'),
    query: buildSearchRouteQuery(params),
  })
}

const goToPage = async (page: number) => {
  loading.value = true

  try {
    await pushSearchRoute(formToSearchParams(page))

    if (import.meta.client) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } finally {
    loading.value = false
  }
}

const runSearch = async (page = 1) => {
  loading.value = true

  try {
    await pushSearchRoute(formToSearchParams(page))
    if (!isLgUp.value) {
      mobileSearchExpanded.value = false
      filtersOpen.value = false
    }
  } finally {
    loading.value = false
  }
}

const mobileSearchSummary = computed(() => {
  const parts: string[] = []

  if (form.city.trim()) {
    parts.push(form.city.trim())
  } else {
    parts.push($t('search.cityPlaceholder'))
  }

  if (form.checkIn && form.checkOut) {
    parts.push(`${form.checkIn} — ${form.checkOut}`)
  } else {
    parts.push(t('datesAny'))
  }

  const guests = Number(form.guests) || 2
  parts.push(t('guestsCount', { n: guests }))

  return parts.join(' · ')
})

const applyPreferredCityToSearch = async () => {
  const cityName = preferredCity.value

  if (!cityName || routeSearchParams.value.city) {
    return
  }

  form.city = cityName

  const nextKey = searchFilterCacheKey({ ...formToSearchParams(1), city: cityName })

  if (nextKey === searchFilterCacheKey(routeSearchParams.value)) {
    return
  }

  await runSearch(1)
}

watch(preferredCity, () => {
  void applyPreferredCityToSearch()
}, { immediate: true })

let filterApplyTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => [
    form.minPrice,
    form.maxPrice,
    form.sort,
    [...form.amenities].sort().join(','),
    [...form.accommodationTypes].sort().join(','),
    [...form.teamBadgeSlugs].sort().join(','),
  ],
  () => {
    clearTimeout(filterApplyTimer)

    filterApplyTimer = setTimeout(() => {
      const nextKey = searchFilterCacheKey(formToSearchParams(1))

      if (nextKey === searchFilterCacheKey(routeSearchParams.value)) {
        return
      }

      void runSearch(1)
    }, 400)
  },
)

const toListingCard = (item: NonNullable<typeof results.value>['items'][number]) => ({
  id: item.id,
  hostId: '',
  title: item.title,
  description: '',
  status: 'published' as const,
  pricePerNight: item.pricePerNight,
  city: item.city,
  address: item.address,
  latitude: item.latitude,
  longitude: item.longitude,
  maxGuests: item.maxGuests,
  extraGuestsOffered: false,
  maxGuestsWithExtra: null,
  extraGuestPricePerNight: null,
  bedrooms: item.bedrooms,
  amenities: item.amenities as Amenity[],
  houseRules: '',
  minNights: 1,
  cancellationPolicy: 'moderate' as const,
  cleaningFee: 0,
  createdAt: '',
  updatedAt: '',
  coverPhoto: item.coverPhoto
    ? { ...item.coverPhoto, mediaType: 'photo' as const }
    : null,
  transferOffered: false,
  transferPrice: null,
  transferPriceOnRequest: false,
  averageRating: item.averageRating ?? null,
  reviewCount: item.reviewCount ?? 0,
  teamBadge: item.teamBadge ?? null,
  teamBadgeBlogPost: item.teamBadgeBlogPost ?? null,
  hostNewsCount: item.hostNewsCount,
  latestHostNewsTitle: item.latestHostNewsTitle ?? null,
  latestHostNewsExcerpt: item.latestHostNewsExcerpt ?? null,
  teamReviewExcerptRu: item.teamReviewExcerptRu ?? null,
  teamReviewExcerptEn: item.teamReviewExcerptEn ?? null,
  managedByTeam: item.managedByTeam ?? false,
})

const mapItems = computed(() =>
  (results.value?.items ?? []).map(item => ({
    id: item.id,
    latitude: item.latitude,
    longitude: item.longitude,
    listing: toListingCard(item),
  })),
)

const onMapSelect = (id: string) => {
  activeId.value = id

  const scrollToListing = () => {
    document.getElementById(`listing-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (!isLgUp.value) {
    mobileView.value = 'list'
    nextTick(() => scrollToListing())
    return
  }

  scrollToListing()
}

const onListingHover = (id: string) => {
  activeId.value = id
}

const mapFullscreen = ref(false)
const mapPinsRef = ref<{ resize: () => void } | null>(null)
const filtersOpen = ref(false)
const mobileView = ref<'list' | 'map'>('list')
const isLgUp = ref(false)
const mobileSearchExpanded = ref(false)

const activeFiltersCount = computed(() => {
  let count = 0

  if (form.minPrice || form.maxPrice) {
    count += 1
  }

  count += form.amenities.length
  count += form.teamBadgeSlugs.length
  count += form.accommodationTypes.length

  return count
})

const hasActiveFilters = computed(() => activeFiltersCount.value > 0)

const resultsSummary = computed(() => {
  if (showSkeleton.value) {
    return `${t('results')}…`
  }

  const total = results.value?.total ?? 0

  return total === 0 ? t('resultsNone') : `${t('results')}: ${total}`
})

const clearSearchFilters = async () => {
  form.minPrice = ''
  form.maxPrice = ''
  form.amenities = []
  form.accommodationTypes = []
  form.teamBadgeSlugs = []
  form.sort = ''
  await runSearch(1)
}

const removeActiveFilter = async (tag: SearchActiveFilterTag) => {
  if (tag.kind === 'price') {
    form.minPrice = ''
    form.maxPrice = ''
  } else if (tag.kind === 'amenity' && tag.slug) {
    form.amenities = form.amenities.filter(slug => slug !== tag.slug)
  } else if (tag.kind === 'accommodationType' && tag.slug) {
    form.accommodationTypes = form.accommodationTypes.filter(slug => slug !== tag.slug)
  } else if (tag.kind === 'teamBadge' && tag.slug) {
    form.teamBadgeSlugs = form.teamBadgeSlugs.filter(slug => slug !== tag.slug)
  }

  await runSearch(1)
}

const showListPanel = computed(() => isLgUp.value || mobileView.value === 'list')
const showMapPanel = computed(() => isLgUp.value || mobileView.value === 'map')

const tabButtonClass = (active: boolean) => [
  'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
  active
    ? 'bg-brand-700 text-white shadow-sm dark:bg-brand-600'
    : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800',
]

const updateBreakpoint = () => {
  if (!import.meta.client) {
    return
  }

  isLgUp.value = window.matchMedia('(min-width: 1024px)').matches

  if (isLgUp.value) {
    filtersOpen.value = false
    mobileSearchExpanded.value = false
  }
}

const collapseMobileSearch = () => {
  mobileSearchExpanded.value = false
}

const setMobileView = (view: 'list' | 'map') => {
  mobileView.value = view

  if (view === 'map') {
    nextTick(() => mapPinsRef.value?.resize())
  }
}

const toggleMapFullscreen = () => {
  mapFullscreen.value = !mapFullscreen.value
}

watch(mapFullscreen, (open) => {
  if (import.meta.client) {
    document.body.classList.toggle('overflow-hidden', open)
  }

  nextTick(() => mapPinsRef.value?.resize())
})

const onMapFullscreenKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && mapFullscreen.value) {
    mapFullscreen.value = false
  }
}

let breakpointMedia: MediaQueryList | undefined

onMounted(() => {
  window.addEventListener('keydown', onMapFullscreenKeydown)
  updateBreakpoint()
  breakpointMedia = window.matchMedia('(min-width: 1024px)')
  breakpointMedia.addEventListener('change', updateBreakpoint)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onMapFullscreenKeydown)
  breakpointMedia?.removeEventListener('change', updateBreakpoint)
  clearTimeout(filterApplyTimer)
})

watch(mobileView, (view) => {
  if (view === 'map') {
    nextTick(() => mapPinsRef.value?.resize())
  }
})

watch(routeSearchKey, () => {
  if (!isLgUp.value) {
    collapseMobileSearch()
  }
})
</script>

<template>
  <div class="flex min-h-[calc(100vh-4rem)] flex-col">
    <h1 class="sr-only">
      {{ t('title') }}
    </h1>

    <div class="sticky top-(--site-header-height) z-30 overflow-visible border-b border-stone-200 bg-stone-50/95 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/95">
      <div class="layout-container space-y-2 py-2 lg:space-y-0 lg:py-4">
        <template v-if="!isLgUp">
          <button
            v-if="!mobileSearchExpanded"
            type="button"
            class="flex w-full min-w-0 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left shadow-sm dark:border-stone-700 dark:bg-stone-900"
            data-testid="search-bar-collapsed"
            @click="mobileSearchExpanded = true"
          >
            <Icon
              name="ph:magnifying-glass-duotone"
              class="size-5 shrink-0 text-brand-700 dark:text-brand-400"
            />
            <span class="min-w-0 flex-1 truncate text-sm text-stone-800 dark:text-stone-100">
              {{ mobileSearchSummary }}
            </span>
            <Icon
              name="ph:caret-down-bold"
              class="size-4 shrink-0 text-stone-400"
            />
          </button>

          <div
            v-else
            class="space-y-2"
          >
            <SearchBar
              v-model:city="form.city"
              v-model:check-in="form.checkIn"
              v-model:check-out="form.checkOut"
              v-model:guests="form.guests"
              :city-hint="cityHint"
              variant="toolbar"
              :loading="loading"
              @update:city="onCityChange"
              @submit="runSearch()"
            />
            <button
              type="button"
              class="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
              @click="mobileSearchExpanded = false"
            >
              {{ t('collapseSearch') }}
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UiButton
              type="button"
              variant="outline"
              size="sm"
              class="shrink-0"
              data-testid="search-filters-toggle"
              @click="filtersOpen = !filtersOpen"
            >
              <Icon
                name="ph:funnel-duotone"
                class="mr-1.5 size-4"
              />
              {{ t('filters') }}
              <span
                v-if="activeFiltersCount"
                class="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-brand-500"
              >
                {{ activeFiltersCount }}
              </span>
            </UiButton>

            <div
              class="flex min-w-0 flex-1 rounded-xl border border-stone-200 bg-white p-1 dark:border-stone-800 dark:bg-stone-900"
              role="tablist"
              data-testid="search-view-tabs"
            >
              <button
                type="button"
                role="tab"
                :aria-selected="mobileView === 'list'"
                :class="tabButtonClass(mobileView === 'list')"
                data-testid="search-view-list"
                @click="setMobileView('list')"
              >
                <Icon
                  name="ph:list-bullets-duotone"
                  class="size-4"
                />
                {{ t('list') }}
              </button>
              <button
                type="button"
                role="tab"
                :aria-selected="mobileView === 'map'"
                :class="tabButtonClass(mobileView === 'map')"
                data-testid="search-view-map"
                @click="setMobileView('map')"
              >
                <Icon
                  name="ph:map-trifold-duotone"
                  class="size-4"
                />
                {{ t('map') }}
              </button>
            </div>
          </div>

          <div
            v-show="filtersOpen"
            class="max-h-[min(55vh,28rem)] overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
          >
            <SearchFilters
              v-model:min-price="form.minPrice"
              v-model:max-price="form.maxPrice"
              v-model:amenities="form.amenities"
              v-model:accommodation-types="form.accommodationTypes"
              v-model:team-badge-slugs="form.teamBadgeSlugs"
            />
          </div>
        </template>

        <SearchBar
          v-else
          v-model:city="form.city"
          v-model:check-in="form.checkIn"
          v-model:check-out="form.checkOut"
          v-model:guests="form.guests"
          :city-hint="cityHint"
          variant="toolbar"
          :loading="loading"
          @update:city="onCityChange"
          @submit="runSearch()"
        />
      </div>
    </div>

    <div class="layout-container grid flex-1 grid-cols-1 gap-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:grid-rows-[auto_auto] lg:items-start xl:grid-cols-[240px_minmax(0,1fr)_minmax(22rem,42%)] xl:grid-rows-none">
      <SearchFilters
        v-model:min-price="form.minPrice"
        v-model:max-price="form.maxPrice"
        v-model:amenities="form.amenities"
        v-model:accommodation-types="form.accommodationTypes"
        v-model:team-badge-slugs="form.teamBadgeSlugs"
        class="hidden lg:sticky lg:top-32 lg:block lg:self-start"
      />

      <div
        class="flex min-w-0 flex-col"
        :class="{ 'max-lg:hidden': !showListPanel }"
      >
        <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            class="text-sm font-medium"
            :class="(results?.total ?? 0) === 0 && !showSkeleton
              ? 'text-stone-500 dark:text-stone-500'
              : 'text-stone-700 dark:text-stone-300'"
          >
            {{ resultsSummary }}
          </p>
          <SearchSort
            v-if="(results?.total ?? 0) > 0 || showSkeleton"
            v-model="form.sort"
          />
        </div>

        <div
          v-if="searchError"
          class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {{ searchErrorMessage }}
        </div>

        <SearchActiveFilters
          v-if="hasActiveFilters"
          class="mb-4"
          :min-price="form.minPrice"
          :max-price="form.maxPrice"
          :amenities="form.amenities"
          :accommodation-types="form.accommodationTypes"
          :team-badge-slugs="form.teamBadgeSlugs"
          @remove="removeActiveFilter"
        />

        <div
          v-if="showSkeleton"
          class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
        >
          <div
            v-for="n in 4"
            :key="n"
            class="grid grid-cols-[10rem_minmax(0,1fr)_auto] gap-4 p-4"
          >
            <UiSkeleton
              variant="card"
              class="h-24 rounded-lg"
            />
            <div class="flex flex-col justify-center gap-2">
              <UiSkeleton variant="title" />
              <UiSkeleton class="w-2/3" />
            </div>
            <UiSkeleton class="w-16" />
          </div>
        </div>

        <SearchEmptyState
          v-else-if="!results?.items.length"
          :has-active-filters="hasActiveFilters"
          :title="t('empty')"
          :description="t('emptyDescription')"
          :clear-filters-label="t('clearFilters')"
          :reset-search-label="t('resetSearch')"
          :tip-dates="t('emptyTipDates')"
          :tip-city="t('emptyTipCity')"
          @clear-filters="clearSearchFilters"
        />

        <div
          v-else
          class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
        >
          <div
            v-for="item in results.items"
            :id="`listing-${item.id}`"
            :key="item.id"
            class="px-3 py-4 transition-colors sm:px-4 hover:bg-stone-50 dark:hover:bg-stone-900/60"
            :class="{
              'bg-brand-50/60 dark:bg-brand-950/30': activeId === item.id && !item.promotions?.highlight,
              'bg-brand-50/80 dark:bg-brand-950/40': activeId === item.id && item.promotions?.highlight,
            }"
            @mouseenter="onListingHover(item.id)"
          >
            <SearchResultCard :listing="item" />
          </div>
        </div>

        <nav
          v-if="results?.items.length && totalPages > 1"
          class="mt-4 flex flex-wrap items-center justify-between gap-3"
          aria-label="Pagination"
        >
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{ t('pageOf', { page: currentPage, total: totalPages }) }}
          </p>
          <div class="flex gap-2">
            <UiButton
              type="button"
              variant="outline"
              size="sm"
              :disabled="currentPage <= 1 || showSkeleton"
              @click="goToPage(currentPage - 1)"
            >
              {{ t('prevPage') }}
            </UiButton>
            <UiButton
              type="button"
              variant="outline"
              size="sm"
              :disabled="currentPage >= totalPages || showSkeleton"
              @click="goToPage(currentPage + 1)"
            >
              {{ t('nextPage') }}
            </UiButton>
          </div>
        </nav>
      </div>

      <Teleport
        to="body"
        :disabled="!mapFullscreen"
      >
        <section
          v-if="showMapPanel"
          :class="mapFullscreen
            ? 'fixed inset-0 z-300 flex flex-col bg-stone-50 p-3 dark:bg-stone-950 sm:p-4'
            : 'max-lg:flex max-lg:min-h-0 max-lg:flex-1 lg:col-span-2 xl:sticky xl:top-32 xl:col-span-1 xl:z-10 xl:self-start'"
        >
          <div
            v-if="mapItems.length"
            class="relative"
            :class="mapFullscreen
              ? 'flex min-h-0 flex-1 flex-col'
              : 'h-[min(420px,calc(100dvh-14rem))] max-lg:h-[calc(100dvh-14rem)] max-lg:max-h-none lg:max-h-[min(480px,55vh)] xl:h-[calc(100dvh-11rem)] xl:max-h-[calc(100dvh-11rem)]'"
          >
            <div
              class="absolute left-3 top-3 z-10 flex gap-2"
              :class="mapFullscreen ? 'left-4 top-4' : ''"
            >
              <UiButton
                type="button"
                variant="primary"
                size="lg"
                class="shadow-lg"
                @click="toggleMapFullscreen"
              >
                <Icon
                  :name="mapFullscreen ? 'ph:arrows-in-duotone' : 'ph:arrows-out-duotone'"
                  class="mr-2 size-5"
                />
                {{ mapFullscreen ? t('mapClose') : t('mapExpand') }}
              </UiButton>
            </div>

            <MapPins
              ref="mapPinsRef"
              :items="mapItems"
              :active-id="activeId"
              class="size-full min-h-0 rounded-xl"
              @select="onMapSelect"
            />
          </div>

          <div
            v-else
            class="flex h-[min(420px,calc(100dvh-14rem))] items-center justify-center rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 max-lg:h-[calc(100dvh-14rem)] dark:border-stone-700 dark:text-stone-400 lg:max-h-[min(480px,55vh)] xl:h-[calc(100dvh-11rem)] xl:max-h-[calc(100dvh-11rem)]"
          >
            {{ t('mapEmpty') }}
          </div>
        </section>
      </Teleport>
    </div>
  </div>
</template>
