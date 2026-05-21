import type { AccommodationTypeCatalogItem } from '#shared/types/catalog'

export const FALLBACK_ACCOMMODATION_TYPES: AccommodationTypeCatalogItem[] = [
  { slug: 'eco_house', icon: 'ph:leaf-duotone', labelRu: 'Эко-дом', labelEn: 'Eco house', sortOrder: 1, active: true },
  { slug: 'dome_house', icon: 'ph:globe-hemisphere-east-duotone', labelRu: 'Купольный дом', labelEn: 'Dome house', sortOrder: 2, active: true },
  { slug: 'a_frame', icon: 'ph:triangle-duotone', labelRu: 'A-frame', labelEn: 'A-frame', sortOrder: 3, active: true },
  { slug: 'treehouse', icon: 'ph:tree-duotone', labelRu: 'Дом на дереве', labelEn: 'Treehouse', sortOrder: 4, active: true },
  { slug: 'barnhouse', icon: 'ph:warehouse-duotone', labelRu: 'Барнхаус', labelEn: 'Barnhouse', sortOrder: 5, active: true },
  { slug: 'tent', icon: 'ph:tent-duotone', labelRu: 'Шатёр', labelEn: 'Bell tent', sortOrder: 6, active: true },
  { slug: 'modular_house', icon: 'ph:cube-duotone', labelRu: 'Модульный дом', labelEn: 'Modular house', sortOrder: 7, active: true },
  { slug: 'houseboat', icon: 'ph:boat-duotone', labelRu: 'Дом на воде', labelEn: 'Houseboat', sortOrder: 8, active: true },
  { slug: 'safari_tent', icon: 'ph:campfire-duotone', labelRu: 'Сафари-тент', labelEn: 'Safari tent', sortOrder: 9, active: true },
  { slug: 'tipi', icon: 'ph:triangle-duotone', labelRu: 'Типи', labelEn: 'Tipi', sortOrder: 10, active: true },
  { slug: 'camper', icon: 'ph:van-duotone', labelRu: 'Кэмпер', labelEn: 'Camper', sortOrder: 11, active: true },
  { slug: 'hotel_room', icon: 'ph:bed-duotone', labelRu: 'Номер', labelEn: 'Hotel room', sortOrder: 12, active: true },
]
