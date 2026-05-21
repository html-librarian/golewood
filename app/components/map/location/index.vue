<script setup lang="ts">
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from '~/components/map/pins/style'
import { createHouseMarkerElement } from '~/components/map/marker-element'
import type { MapLocationProps } from './types'

const props = defineProps<MapLocationProps>()

defineOptions({ inheritAttrs: false })

const colorMode = useColorMode()
const mapShell = ref<HTMLElement | null>(null)
const mapRoot = ref<HTMLElement | null>(null)

type MapLibreModule = typeof import('maplibre-gl')
type MapInstance = import('maplibre-gl').Map
type MarkerInstance = import('maplibre-gl').Marker
type StyleSpecification = import('maplibre-gl').StyleSpecification

let maplibre: MapLibreModule | null = null
let map: MapInstance | null = null
let marker: MarkerInstance | null = null
let resizeObserver: ResizeObserver | null = null

const isDarkMap = () => colorMode.value === 'dark'

const getPrimaryStyle = (): StyleSpecification =>
  isDarkMap() ? MAP_STYLE_DARK : MAP_STYLE_LIGHT

const scheduleResize = () => {
  nextTick(() => {
    requestAnimationFrame(() => map?.resize())
  })
}

const syncMarker = () => {
  if (!map || !maplibre) {
    return
  }

  marker?.remove()

  const { element } = createHouseMarkerElement({
    active: false,
    ariaLabel: props.label ?? 'Location',
    interactive: false,
  })

  marker = new maplibre.Marker({ element, anchor: 'bottom' })
    .setLngLat([props.longitude, props.latitude])
    .addTo(map)

  map.setCenter([props.longitude, props.latitude])
  map.setZoom(14)
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
  if (!mapRoot.value) {
    return
  }

  const lib = await ensureMaplibre()

  if (map) {
    if (map.isStyleLoaded()) {
      syncMarker()
    } else {
      map.once('styledata', syncMarker)
    }

    scheduleResize()
    return
  }

  map = new lib.Map({
    container: mapRoot.value,
    style: getPrimaryStyle(),
    center: [props.longitude, props.latitude],
    zoom: 14,
    attributionControl: false,
  })

  map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right')

  map.on('load', () => {
    syncMarker()
    scheduleResize()
  })

  bindResizeObserver()
}

const destroyMap = () => {
  marker?.remove()
  marker = null
  resizeObserver?.disconnect()
  resizeObserver = null
  map?.remove()
  map = null
}

watch(
  () => [props.latitude, props.longitude] as const,
  () => {
    if (map?.isStyleLoaded()) {
      syncMarker()
    }
  },
)

watch(() => colorMode.value, () => {
  if (!map) {
    return
  }

  map.setStyle(getPrimaryStyle())
  map.once('styledata', syncMarker)
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
</script>

<template>
  <ClientOnly>
    <div
      ref="mapShell"
      class="relative isolate w-full overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800"
      :class="props.class"
      data-testid="map-location"
    >
      <div
        ref="mapRoot"
        class="map-pins-root h-full w-full min-h-[220px] md:min-h-[280px]"
      />
    </div>
  </ClientOnly>
</template>
