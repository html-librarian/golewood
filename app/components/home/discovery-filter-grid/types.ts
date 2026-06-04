import type { HomeDiscoveryFilter } from '#shared/catalog/home-discovery'

export type HomeDiscoveryFilterGridVariant = 'tiles' | 'chips'

export interface HomeDiscoveryFilterGridProps {
  filters: HomeDiscoveryFilter[]
  variant?: HomeDiscoveryFilterGridVariant
}

export interface HomeDiscoveryFilterGridEmits {
  select: [filter: HomeDiscoveryFilter]
}
