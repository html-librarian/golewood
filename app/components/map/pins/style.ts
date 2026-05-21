import type { StyleSpecification } from 'maplibre-gl'

const createRasterStyle = (tiles: string[], attribution: string): StyleSpecification => ({
  version: 8,
  sources: {
    basemap: {
      type: 'raster',
      tiles,
      tileSize: 256,
      attribution,
    },
  },
  layers: [
    {
      id: 'basemap',
      type: 'raster',
      source: 'basemap',
    },
  ],
})

const CARTO_SUBDOMAINS = ['a', 'b', 'c', 'd']

const cartoTiles = (path: string) =>
  CARTO_SUBDOMAINS.map(sub => `https://${sub}.basemaps.cartocdn.com/${path}/{z}/{x}/{y}.png`)

/** Light basemap — CARTO raster (demotiles.maplibre.org returns 404). */
export const MAP_STYLE_LIGHT = createRasterStyle(
  cartoTiles('rastertiles/voyager'),
  '© OpenStreetMap © CARTO',
)

export const MAP_STYLE_DARK = createRasterStyle(
  cartoTiles('dark_all'),
  '© OpenStreetMap © CARTO',
)

export const MAP_STYLE_CARTO = createRasterStyle(
  cartoTiles('rastertiles/voyager'),
  '© OpenStreetMap © CARTO',
)
