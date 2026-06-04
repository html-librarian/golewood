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
  description: t('title'),
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

const hasHomePromos = computed(() =>
  Boolean(homePromosResolved.value.featured) || homePromosResolved.value.carousel.length > 0,
)

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

const heroSectionRef = ref<HTMLElement | null>(null)
const { meshStyle, orbStyle, orbStyleSlow } = useHeroParallax(heroSectionRef)
</script>

<template>
  <div>
    <section
      ref="heroSectionRef"
      class="relative isolate"
    >
      <div class="pointer-events-none absolute inset-0 overflow-clip">
        <img
          v-if="hero?.imageUrl"
          :src="hero.imageUrl"
          alt=""
          class="hero-photo-zoom absolute inset-0 size-full object-cover"
        >
        <div
          class="absolute inset-0"
          :class="hero?.imageUrl
            ? 'bg-linear-to-b from-brand-950/50 via-brand-900/35 to-brand-950/75'
            : 'bg-linear-to-br from-brand-950 via-brand-900 to-brand-800'"
        />
        <div
          class="hero-mesh absolute inset-0"
          :style="meshStyle"
        />
        <div
          class="absolute -left-24 top-1/4 size-72 rounded-full bg-brand-400/20 blur-3xl"
          :style="orbStyleSlow"
          aria-hidden="true"
        />
        <div
          class="absolute -right-16 bottom-0 size-96 rounded-full bg-accent-400/15 blur-3xl"
          :style="orbStyle"
          aria-hidden="true"
        />
      </div>
      <div class="page-container relative pb-24 pt-14 md:pb-28 md:pt-20">
        <div class="mx-auto max-w-4xl text-center text-white">
          <p class="editorial-kicker editorial-kicker-leaf mb-4 text-brand-200/90">
            Golewood
          </p>
          <h1 class="hero-title-display font-display text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.08] tracking-tight">
            {{ t('title') }}
          </h1>
          <p
            v-if="heroCredit"
            class="mx-auto mt-5 max-w-xl text-xs text-brand-200/80 md:mt-6"
          >
            {{ heroCredit }}
          </p>
          <NuxtLink
            :to="localePath('/spotlight')"
            class="spotlight-cta mt-5"
            data-testid="home-spotlight-cta"
          >
            {{ $t('spotlight.link') }}
            <Icon
              name="ph:camera-duotone"
              class="size-4"
            />
          </NuxtLink>
        </div>

        <div class="search-canopy mx-auto mt-12 w-full max-w-5xl md:mt-14">
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

        <ul class="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3 md:mt-12">
          <li
            v-for="item in trustItems"
            :key="item.label"
            class="trust-pill-enter trust-pill-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-brand-50 ring-1"
          >
            <Icon
              :name="item.icon"
              class="size-4 text-accent-300"
            />
            {{ item.label }}
          </li>
        </ul>
      </div>
      <UiForestDivider />
    </section>

    <template v-if="hasHomePromos">
      <HomePromoBanners :section="homePromosResolved" />
      <UiForestDivider tone="sand" />
    </template>

    <UiReveal>
      <section class="overflow-x-clip py-10 md:py-12">
        <div class="page-container space-y-6">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="section-title section-title-accent section-title-accent-center mx-auto text-center">
              {{ t('discoveryTitle') }}
            </h2>
            <p class="section-subtitle mx-auto mt-3">
              {{ t('discoverySubtitle') }}
            </p>
          </div>
          <HomeDiscoveryFilters :groups="discoveryGroupsResolved" />
        </div>
      </section>
    </UiReveal>

    <UiReveal :delay="80">
      <section class="page-container pb-8 pt-6 md:pb-10 md:pt-8">
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
            <p class="editorial-kicker editorial-kicker-leaf">
              {{ listings?.scope === 'city' && listings.city ? listings.city : 'Golewood' }}
            </p>
            <h2 class="section-title mt-2 section-title-accent">
              {{ featuredTitle }}
            </h2>
            <p class="section-subtitle mt-2 max-w-2xl">
              {{ featuredDesc }}
            </p>
          </div>
          <NuxtLink
            :to="localePath(listings?.scope === 'city' && listings.city
              ? { path: '/search', query: { city: listings.city } }
              : '/search')"
            class="link-forest hidden text-sm md:inline"
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
    </UiReveal>
  </div>
</template>
