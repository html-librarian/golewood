import type { SearchParams } from '#shared/types/search'

export type HomeDiscoveryParams = Pick<SearchParams, 'city' | 'amenities' | 'teamBadgeSlugs' | 'accommodationTypes'>

export type HomeDiscoveryAdminItem = {
  id: string
  itemKey: string
  groupId: string
  labelRu: string
  labelEn: string
  icon: string
  tone: string
  params: HomeDiscoveryParams
  active: boolean
  sortOrder: number
}

export type HomeDiscoveryAdminGroup = {
  id: string
  titleRu: string
  titleEn: string
  sortOrder: number
  items: HomeDiscoveryAdminItem[]
}
