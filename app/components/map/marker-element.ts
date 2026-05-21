import { HOUSE_MARKER_ICON_SVG } from './marker-icon-svg'

export type HouseMarkerHandle = {
  element: HTMLElement
}

export const createHouseMarkerElement = (
  options: { active: boolean, ariaLabel: string, interactive?: boolean },
): HouseMarkerHandle => {
  const element = document.createElement(options.interactive === false ? 'div' : 'button')

  if (element instanceof HTMLButtonElement) {
    element.type = 'button'
  }

  element.className = options.active
    ? 'map-house-marker map-house-marker--active'
    : 'map-house-marker'
  element.setAttribute('aria-label', options.ariaLabel)

  const iconHost = document.createElement('span')
  iconHost.setAttribute('aria-hidden', 'true')
  iconHost.className = 'map-house-marker__icon pointer-events-none'
  iconHost.innerHTML = HOUSE_MARKER_ICON_SVG
  element.appendChild(iconHost)

  return { element }
}
