/** Phosphor duotone icons that are referenced in catalog but missing from Iconify. */
const AMENITY_ICON_FALLBACKS: Record<string, string> = {
  'ph:microwave-duotone': 'ph:oven-duotone',
  'ph:surfboard-duotone': 'ph:person-simple-swim-duotone',
  'ph:shuttlecock-duotone': 'ph:volleyball-duotone',
  'ph:bottle-duotone': 'ph:spray-bottle-duotone',
}

export const resolveAmenityIcon = (icon: string | undefined | null): string => {
  if (!icon) {
    return 'ph:check-circle-duotone'
  }

  return AMENITY_ICON_FALLBACKS[icon] ?? icon
}
