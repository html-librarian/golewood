<script setup lang="ts">
import { createVNode, render } from 'vue'
import ListingMapPopupCard from '~/components/listing/map-popup-card/index.vue'
import { createHouseMarkerElement } from '~/components/map/marker-element'
import type { ListingCard as ListingCardModel } from '#shared/types/listing'
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from './style'
import type { MapPinItem, MapPinsEmits, MapPinsProps } from './types'

const props = defineProps<MapPinsProps>()
const emit = defineEmits<MapPinsEmits>()

defineOptions({ inheritAttrs: false })

const nuxtApp = useNuxtApp()
const colorMode = useColorMode()
const mapShell = ref<HTMLElement | null>(null)
const mapRoot = ref<HTMLElement | null>(null)

type MapLibreModule = typeof import('maplibre-gl')
type MapInstance = import('maplibre-gl').Map
type MarkerInstance = import('maplibre-gl').Marker
type PopupInstance = import('maplibre-gl').Popup
type StyleSpecification = import('maplibre-gl').StyleSpecification

/** Gap between marker anchor and popup bottom edge (px). */
const POPUP_OFFSET_PX = 16

let maplibre: MapLibreModule | null = null
let map: MapInstance | null = null
let resizeObserver: ResizeObserver | null = null
const markersById = new Map<string, MarkerInstance>()
const popupsById = new Map<string, PopupInstance>()
const popupCleanups = new Map<string, () => void>()
const popupOpenId = ref<string | null>(null)

const syncMarkerVisibility = () => {
  for (const [id, marker] of markersById) {
    const element = marker.getElement()

    if (!element) {
      continue
    }

    element.style.visibility = popupOpenId.value === id ? 'hidden' : 'visible'
  }
}

const isDarkMap = () => colorMode.value === 'dark'

const getPrimaryStyle = (): StyleSpecification =>
  isDarkMap() ? MAP_STYLE_DARK : MAP_STYLE_LIGHT

const scheduleResize = () => {
  nextTick(() => {
    requestAnimationFrame(() => map?.resize())
  })
}

const cleanupPopup = (id: string) => {
  popupCleanups.get(id)?.()
  popupCleanups.delete(id)
  popupsById.get(id)?.remove()
  popupsById.delete(id)

  if (popupOpenId.value === id) {
    popupOpenId.value = null
    syncMarkerVisibility()
  }
}

const cleanupAllPopups = () => {
  for (const id of [...popupCleanups.keys()]) {
    cleanupPopup(id)
  }

  popupOpenId.value = null
  syncMarkerVisibility()
}

const createPopupContent = (listing: ListingCardModel) => {
  const container = document.createElement('div')
  container.className = 'listing-map-popup-inner bg-transparent p-0'

  const vnode = createVNode(ListingMapPopupCard, { listing })
  vnode.appContext = nuxtApp.vueApp._context
  render(vnode, container)

  return {
    container,
    cleanup: () => render(null, container),
  }
}

const bindListingPopup = (item: MapPinItem) => {
  if (!map || !maplibre) {
    return
  }

  cleanupPopup(item.id)

  const { container, cleanup } = createPopupContent(item.listing)
  popupCleanups.set(item.id, cleanup)

  const existing = popupsById.get(item.id)
  existing?.remove()

  const popup = new maplibre.Popup({
    closeButton: true,
    closeOnClick: false,
    anchor: 'bottom',
    offset: POPUP_OFFSET_PX,
    maxWidth: 'none',
    className: 'listing-map-popup',
    subpixelPositioning: true,
  })
    .setDOMContent(container)
    .setLngLat([item.longitude, item.latitude])
    .addTo(map)

  popup.on('close', () => cleanupPopup(item.id))
  popupsById.set(item.id, popup)
  popupOpenId.value = item.id
  syncMarkerVisibility()
}

const openPopup = (id: string) => {
  if (!map) {
    return
  }

  const item = props.items.find(entry => entry.id === id)

  if (!item?.latitude || !item.longitude) {
    return
  }

  bindListingPopup(item)
  map.flyTo({
    center: [item.longitude, item.latitude],
    zoom: Math.max(map.getZoom(), 12),
    duration: 500,
  })
}

const clearMarkers = () => {
  for (const marker of markersById.values()) {
    marker.remove()
  }

  markersById.clear()
  cleanupAllPopups()
}

const syncMarkers = () => {
  if (!map || !maplibre || !map.isStyleLoaded()) {
    return
  }

  clearMarkers()

  const validItems = props.items.filter(item => item.latitude && item.longitude)

  for (const item of validItems) {
    const { element } = createHouseMarkerElement({
      active: props.activeId === item.id,
      ariaLabel: item.listing.title,
    })

    const marker = new maplibre.Marker({ element, anchor: 'bottom' })
      .setLngLat([item.longitude, item.latitude])
      .addTo(map)

    element.addEventListener('click', (event) => {
      event.stopPropagation()
      emit('select', item.id)
      bindListingPopup(item)
    })

    markersById.set(item.id, marker)
  }

  if (validItems.length > 1) {
    const bounds = new maplibre.LngLatBounds()

    for (const item of validItems) {
      bounds.extend([item.longitude, item.latitude])
    }

    map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 })
  } else if (validItems.length === 1) {
    const item = validItems[0]
    map.setCenter([item.longitude, item.latitude])
    map.setZoom(12)
  }

  if (props.activeId) {
    openPopup(props.activeId)
  }

  scheduleResize()
}

const ensureMaplibre = async () => {
  if (!maplibre) {
    maplibre = await import('maplibre-gl')
    await import('maplibre-gl/dist/maplibre-gl.css')
  }

  return maplibre
}

const bindResizeObserver = () => {
  if (!mapShell.value || resizeObserver) {
    return
  }

  resizeObserver = new ResizeObserver(() => map?.resize())
  resizeObserver.observe(mapShell.value)
}

const initMap = async () => {
  if (!mapRoot.value || !props.items.length) {
    return
  }

  const lib = await ensureMaplibre()

  if (map) {
    if (map.isStyleLoaded()) {
      syncMarkers()
    } else {
      map.once('styledata', syncMarkers)
    }

    scheduleResize()
    return
  }

  const first = props.items.find(item => item.latitude && item.longitude) ?? props.items[0]

  map = new lib.Map({
    container: mapRoot.value,
    style: getPrimaryStyle(),
    center: [first.longitude, first.latitude],
    zoom: 11,
    attributionControl: false,
  })

  map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right')

  map.on('load', () => {
    syncMarkers()
    scheduleResize()
  })

  map.on('error', (event) => {
    if (import.meta.dev) {
      console.warn('[MapPins] map error', event.error?.message ?? event)
    }
  })

  bindResizeObserver()
}

const destroyMap = () => {
  clearMarkers()
  resizeObserver?.disconnect()
  resizeObserver = null
  map?.remove()
  map = null
}

watch(() => props.items, () => {
  if (!props.items.length) {
    destroyMap()
    return
  }

  initMap()
}, { deep: true })

watch(() => props.activeId, (id) => {
  if (!id || !map) {
    return
  }

  for (const [markerId, marker] of markersById) {
    const element = marker.getElement()

    if (!element) {
      continue
    }

    const item = props.items.find(entry => entry.id === markerId)

    if (!item) {
      continue
    }

    const active = markerId === id
    element.className = active ? 'map-house-marker map-house-marker--active' : 'map-house-marker'
  }

  openPopup(id)
})

watch(() => colorMode.value, () => {
  if (!map) {
    return
  }

  map.setStyle(getPrimaryStyle())
  map.once('styledata', syncMarkers)
})

onMounted(() => {
  nextTick(() => {
    initMap()
    scheduleResize()
  })
})

onBeforeUnmount(() => {
  destroyMap()
})

defineExpose({ resize: scheduleResize })
</script>

<template>
  <ClientOnly>
    <div
      ref="mapShell"
      class="relative isolate w-full overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800"
      :class="props.class"
    >
      <div
        ref="mapRoot"
        class="map-pins-root h-full w-full"
      />
    </div>
  </ClientOnly>
</template>
