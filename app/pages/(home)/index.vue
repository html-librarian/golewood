<script setup lang="ts">
import { HOME_DISCOVERY_GROUPS } from '#shared/catalog/home-discovery'
import type { HomeDiscoveryGroup } from '#shared/catalog/home-discovery'
import { partitionPromotedForSearch } from '#shared/utils/promotion'
import ru from './i18n/ru'
import en from './i18n/en'

const { t } = usePageI18n({ ru, en })
const { t: $t, locale } = useI18n()
const localePath = useLocalePath()
const { fetchDiscoveryGroups } = useHomeDiscovery()
const { fetchHomePromos } = useHomePromos()
const { fetchPublished } = useListings()
const { fetchHomeHero } = useHomeHero()
const { city: preferredCity, isGeoDefault, setCity, clearCity } = useUserCity()

useSiteSeo({
  title: t('title'),
  description: t('subtitle'),
})

const searchForm = reactive({
  city: '',
  checkIn: '',
  checkOut: '',
  guests: '2',
})

watch(preferredCity, (cityName) => {
  searchForm.city = cityName ?? ''
}, { immediate: true })

const cityHint = computed(() => {
  if (!isGeoDefault.value || !searchForm.city) {
    return undefined
  }

  return $t('form.cityDefaultHint', { city: searchForm.city })
})

const onCityChange = (value: string) => {
  searchForm.city = value

  if (value) {
    setCity(value, 'manual')
    return
  }

  clearCity()
}

const goSearch = async () => {
  if (searchForm.city) {
    setCity(searchForm.city)
  }

  await navigateTo({
    path: localePath('/search'),
    query: Object.fromEntries(
      Object.entries(searchForm).filter(([, value]) => value),
    ),
  })
}

const { data: hero } = await useAsyncData('home-hero', () => fetchHomeHero())

const heroCredit = computed(() => {
  if (!hero.value?.imageUrl) {
    return null
  }

  if (hero.value.source === 'contest' && hero.value.listingTitle) {
    return $t('spotlight.heroCredit', { listing: hero.value.listingTitle })
  }

  const credit = locale.value === 'en' ? hero.value.creditEn : hero.value.creditRu
  return credit?.trim() || null
})

const { data: homePromos } = await useAsyncData('home-promos', () => fetchHomePromos())

const homePromosResolved = computed(() => homePromos.value ?? { featured: null, carousel: [] })

const { data: discoveryGroups } = await useAsyncData('home-discovery', () => fetchDiscoveryGroups())

const discoveryGroupsResolved = computed<HomeDiscoveryGroup[]>(
  () => discoveryGroups.value ?? HOME_DISCOVERY_GROUPS,
)

const emptyListingsResult = (city: string | null = null) => ({
  items: [] as Awaited<ReturnType<typeof fetchPublished>>,
  scope: 'all' as const,
  city,
})

const { data: listings, pending } = await useAsyncData(
  () => `home-listings-${preferredCity.value ?? 'all'}`,
  async () => {
    const cityName = preferredCity.value

    try {
      if (cityName) {
        const inCity = await fetchPublished(cityName)

        if (inCity.length) {
          return { items: inCity, scope: 'city' as const, city: cityName }
        }
      }

      const all = await fetchPublished()
      return { items: all, scope: 'all' as const, city: cityName ?? null }
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'statusCode' in err
        ? Number((err as { statusCode: number }).statusCode)
        : 0

      if (status === 503) {
        return emptyListingsResult(cityName ?? null)
      }

      throw err
    }
  },
  { watch: [preferredCity] },
)

const FEATURED_LIMIT = 8

const sortedListings = computed(() =>
  partitionPromotedForSearch(
    listings.value?.items ?? [],
    listings.value?.scope === 'city' ? listings.value.city ?? undefined : undefined,
  ),
)

const heroListing = computed(() => {
  if (listings.value?.scope !== 'city' || !listings.value.city) {
    return null
  }

  const cityKey = listings.value.city.trim().toLowerCase()

  return sortedListings.value.find(item =>
    item.promotions?.cityPin
    && item.city.trim().toLowerCase() === cityKey,
  ) ?? null
})

const displayListings = computed(() => {
  const heroId = heroListing.value?.id
  const rest = heroId
    ? sortedListings.value.filter(item => item.id !== heroId)
    : sortedListings.value

  return rest.slice(0, FEATURED_LIMIT)
})

const carouselLabels = computed(() => ({
  prev: t('carouselPrev'),
  next: t('carouselNext'),
  pages: t('carouselPages'),
  goToPage: t('carouselGoToPage'),
}))

const featuredTitle = computed(() => {
  if (listings.value?.scope === 'city' && listings.value.city) {
    return t('featuredInCity', { city: listings.value.city })
  }

  return t('featured')
})

const featuredDesc = computed(() => {
  if (listings.value?.scope === 'city') {
    return t('featuredInCityDesc')
  }

  return t('featuredDesc')
})

const trustItems = computed(() => [
  { icon: 'ph:shield-check-duotone', label: t('trustSecure') },
  { icon: 'ph:credit-card-duotone', label: t('trustPayment') },
  { icon: 'ph:headset-duotone', label: t('trustSupport') },
])
</script>

<template>
  <div>
    <section class="relative">
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          v-if="hero?.imageUrl"
          :src="hero.imageUrl"
          alt=""
          class="absolute inset-0 size-full object-cover"
        >
        <div
          class="absolute inset-0"
          :class="hero?.imageUrl
            ? 'bg-linear-to-br from-brand-950/25 via-brand-900/15 to-brand-950/35'
            : 'bg-linear-to-br from-brand-900 via-brand-800 to-brand-700'"
        />
        <div
          v-if="!hero?.imageUrl"
          class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.15),transparent_35%)]"
        />
      </div>
      <div class="page-container relative pb-20 pt-12 md:pb-24 md:pt-16">
        <div class="mx-auto max-w-5xl text-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          <p class="mb-3 text-sm font-medium uppercase tracking-widest text-brand-200">
            Golewood
          </p>
          <h1 class="font-display text-[clamp(1.375rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight whitespace-nowrap max-[360px]:whitespace-normal max-[360px]:text-[1.625rem]">
            {{ t('title') }}
          </h1>
          <p class="mx-auto mt-4 max-w-xl text-base text-brand-100 md:text-lg">
            {{ t('subtitle') }}
          </p>
          <p
            v-if="heroCredit"
            class="mx-auto mt-3 max-w-xl text-xs text-brand-200/90"
          >
            {{ heroCredit }}
          </p>
          <NuxtLink
            :to="localePath('/spotlight')"
            class="mt-4 inline-flex text-sm font-medium text-accent-300 underline-offset-4 hover:text-accent-200 hover:underline"
          >
            {{ $t('spotlight.link') }} →
          </NuxtLink>
        </div>

        <div class="mx-auto mt-12 w-full max-w-6xl md:mt-16 xl:max-w-7xl">
          <SearchBar
            v-model:city="searchForm.city"
            v-model:check-in="searchForm.checkIn"
            v-model:check-out="searchForm.checkOut"
            v-model:guests="searchForm.guests"
            :city-hint="cityHint"
            variant="hero"
            @update:city="onCityChange"
            @submit="goSearch()"
          />
        </div>

        <ul class="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-4 md:mt-12 md:gap-8">
          <li
            v-for="item in trustItems"
            :key="item.label"
            class="flex items-center gap-2 text-sm text-brand-100"
          >
            <Icon
              :name="item.icon"
              class="size-5 text-accent-400"
            />
            {{ item.label }}
          </li>
        </ul>
      </div>
    </section>

    <HomePromoBanners :section="homePromosResolved" />

    <section class="overflow-x-clip border-t border-stone-200 bg-white py-10 dark:border-stone-800 dark:bg-stone-950 md:py-12">
      <div class="page-container space-y-6">
        <div class="text-center">
          <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50 md:text-2xl">
            {{ t('discoveryTitle') }}
          </h2>
          <p class="mx-auto mt-2 max-w-xl text-sm text-stone-600 dark:text-stone-400">
            {{ t('discoverySubtitle') }}
          </p>
        </div>
        <HomeDiscoveryFilters :groups="discoveryGroupsResolved" />
      </div>
    </section>

    <section class="page-container">
      <div
        v-if="pending"
        class="space-y-6"
      >
        <div class="space-y-2">
          <UiSkeleton variant="title" class="w-48" />
          <UiSkeleton class="w-64" />
        </div>
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          <div
            v-for="n in 4"
            :key="n"
            class="surface-card space-y-3 p-4"
          >
            <UiSkeleton variant="card" />
            <UiSkeleton variant="title" />
            <UiSkeleton class="w-2/3" />
          </div>
        </div>
      </div>

      <div
        v-else-if="displayListings.length || heroListing"
        class="space-y-6"
      >
        <div class="flex items-end justify-between gap-4">
          <div>
            <h2 class="section-title">
              {{ featuredTitle }}
            </h2>
            <p class="section-subtitle mt-1">
              {{ featuredDesc }}
            </p>
          </div>
          <NuxtLink
            :to="localePath(listings?.scope === 'city' && listings.city
              ? { path: '/search', query: { city: listings.city } }
              : '/search')"
            class="hidden text-sm font-semibold text-brand-700 hover:text-brand-800 md:inline dark:text-brand-300"
          >
            {{ t('viewAll') }} →
          </NuxtLink>
        </div>

        <ListingFeaturedHero
          v-if="heroListing"
          :listing="heroListing"
          class="mb-6"
        />

        <ListingFeaturedCarousel
          :listings="displayListings"
          :labels="carouselLabels"
        />
      </div>

      <div
        v-else
        class="surface-card mx-auto max-w-lg p-10 text-center"
      >
        <Icon
          name="ph:house-line-duotone"
          class="mx-auto size-12 text-stone-400"
        />
        <p class="mt-4 text-stone-600 dark:text-stone-400">
          {{ t('empty') }}
        </p>
      </div>
    </section>
  </div>
</template>
