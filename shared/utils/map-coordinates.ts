export const hasValidMapCoordinates = (latitude: number, longitude: number) =>
  Number.isFinite(latitude)
  && Number.isFinite(longitude)
  && (Math.abs(latitude) > 0.001 || Math.abs(longitude) > 0.001)

export const buildYandexMapsUrl = (latitude: number, longitude: number) =>
  `https://yandex.ru/maps/?pt=${longitude},${latitude}&z=15&l=map`
