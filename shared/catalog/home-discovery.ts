import type { SearchParams } from '#shared/types/search'

export type HomeDiscoveryFilter = {
  id: string
  labelRu: string
  labelEn: string
  icon: string
  tone: string
  params: Pick<SearchParams, 'city' | 'amenities' | 'teamBadgeSlugs' | 'accommodationTypes'>
}

export type HomeDiscoveryGroup = {
  id: string
  titleRu: string
  titleEn: string
  filters: HomeDiscoveryFilter[]
}

/** Quick filters on the home page — each item maps to /search query params. */
export const HOME_DISCOVERY_GROUPS: HomeDiscoveryGroup[] = [
  {
    id: 'destinations',
    titleRu: 'Направления',
    titleEn: 'Destinations',
    filters: [
      {
        id: 'sochi',
        labelRu: 'Сочи',
        labelEn: 'Sochi',
        icon: 'ph:sun-duotone',
        tone: 'from-sky-400 to-cyan-600',
        params: { city: 'Сочи' },
      },
      {
        id: 'kazan',
        labelRu: 'Казань',
        labelEn: 'Kazan',
        icon: 'ph:mosque-duotone',
        tone: 'from-emerald-500 to-teal-700',
        params: { city: 'Казань' },
      },
      {
        id: 'krasnodar',
        labelRu: 'Краснодар',
        labelEn: 'Krasnodar',
        icon: 'ph:plant-duotone',
        tone: 'from-lime-500 to-green-700',
        params: { city: 'Краснодар' },
      },
      {
        id: 'karelia',
        labelRu: 'Карелия',
        labelEn: 'Karelia',
        icon: 'ph:tree-duotone',
        tone: 'from-teal-600 to-emerald-800',
        params: { city: 'Петрозаводск' },
      },
      {
        id: 'altai',
        labelRu: 'Алтай',
        labelEn: 'Altai',
        icon: 'ph:mountains-duotone',
        tone: 'from-indigo-500 to-violet-700',
        params: { city: 'Горно-Алтайск' },
      },
      {
        id: 'spb',
        labelRu: 'Санкт-Петербург',
        labelEn: 'Saint Petersburg',
        icon: 'ph:buildings-duotone',
        tone: 'from-slate-500 to-slate-700',
        params: { city: 'Санкт-Петербург' },
      },
      {
        id: 'moscow',
        labelRu: 'Подмосковье',
        labelEn: 'Moscow region',
        icon: 'ph:house-line-duotone',
        tone: 'from-stone-500 to-stone-700',
        params: { city: 'Москва' },
      },
      {
        id: 'anapa',
        labelRu: 'Анапа',
        labelEn: 'Anapa',
        icon: 'ph:beach-ball-duotone',
        tone: 'from-amber-400 to-orange-600',
        params: { city: 'Анапа' },
      },
    ],
  },
  {
    id: 'comfort',
    titleRu: 'Удобства',
    titleEn: 'Amenities',
    filters: [
      {
        id: 'pets',
        labelRu: 'С питомцами',
        labelEn: 'Pets allowed',
        icon: 'ph:dog-duotone',
        tone: 'from-amber-500 to-orange-600',
        params: { amenities: ['pets_allowed'] },
      },
      {
        id: 'hot-tub',
        labelRu: 'С чаном',
        labelEn: 'Hot tub',
        icon: 'ph:bathtub-duotone',
        tone: 'from-rose-500 to-red-700',
        params: { amenities: ['hot_tub'] },
      },
      {
        id: 'pool',
        labelRu: 'С бассейном',
        labelEn: 'Pool',
        icon: 'ph:waves-duotone',
        tone: 'from-blue-400 to-blue-700',
        params: { amenities: ['pool'] },
      },
      {
        id: 'sauna',
        labelRu: 'Баня / SPA',
        labelEn: 'Sauna / spa',
        icon: 'ph:thermometer-hot-duotone',
        tone: 'from-orange-500 to-amber-700',
        params: { amenities: ['sauna'] },
      },
      {
        id: 'children',
        labelRu: 'Для детей',
        labelEn: 'Family friendly',
        icon: 'ph:baby-duotone',
        tone: 'from-pink-400 to-rose-600',
        params: { amenities: ['children_allowed', 'playground'] },
      },
      {
        id: 'grill',
        labelRu: 'Мангал',
        labelEn: 'BBQ',
        icon: 'ph:fire-simple-duotone',
        tone: 'from-red-500 to-orange-700',
        params: { amenities: ['grill'] },
      },
      {
        id: 'parking',
        labelRu: 'Парковка',
        labelEn: 'Parking',
        icon: 'ph:car-duotone',
        tone: 'from-slate-400 to-slate-600',
        params: { amenities: ['parking'] },
      },
      {
        id: 'wifi',
        labelRu: 'Wi‑Fi',
        labelEn: 'Wi‑Fi',
        icon: 'ph:wifi-high-duotone',
        tone: 'from-brand-500 to-brand-700',
        params: { amenities: ['wifi'] },
      },
    ],
  },
  {
    id: 'nature',
    titleRu: 'Природа и виды',
    titleEn: 'Nature & views',
    filters: [
      {
        id: 'water',
        labelRu: 'У воды',
        labelEn: 'By the water',
        icon: 'ph:drop-duotone',
        tone: 'from-cyan-400 to-blue-600',
        params: { amenities: ['view_water'] },
      },
      {
        id: 'sea',
        labelRu: 'У моря',
        labelEn: 'By the sea',
        icon: 'ph:beach-ball-duotone',
        tone: 'from-sky-300 to-blue-600',
        params: { amenities: ['view_sea'] },
      },
      {
        id: 'mountains',
        labelRu: 'В горах',
        labelEn: 'In the mountains',
        icon: 'ph:mountains-duotone',
        tone: 'from-violet-500 to-purple-800',
        params: { amenities: ['view_mountain'] },
      },
      {
        id: 'forest',
        labelRu: 'В лесу',
        labelEn: 'In the forest',
        icon: 'ph:tree-duotone',
        tone: 'from-green-600 to-emerald-900',
        params: { amenities: ['location_forest'] },
      },
    ],
  },
]
