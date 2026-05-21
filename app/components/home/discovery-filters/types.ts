import type { HomeDiscoveryFilter, HomeDiscoveryGroup } from '#shared/catalog/home-discovery'

export interface HomeDiscoveryFiltersProps {
  groups: HomeDiscoveryGroup[]
}

export interface HomeDiscoveryFiltersEmits {
  select: [filter: HomeDiscoveryFilter]
}
