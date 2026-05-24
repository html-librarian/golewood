import type { HomeDiscoveryFilter } from '#shared/catalog/home-discovery'

export interface HomeDiscoveryDestinationsCarouselProps {
  filters: HomeDiscoveryFilter[]
}

export interface HomeDiscoveryDestinationsCarouselEmits {
  select: [filter: HomeDiscoveryFilter]
}
