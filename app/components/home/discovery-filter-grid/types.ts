import type { HomeDiscoveryFilter } from '#shared/catalog/home-discovery'

export interface HomeDiscoveryFilterGridProps {
  filters: HomeDiscoveryFilter[]
}

export interface HomeDiscoveryFilterGridEmits {
  select: [filter: HomeDiscoveryFilter]
}
