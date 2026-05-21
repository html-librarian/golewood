import { Meilisearch } from 'meilisearch'

const INDEX_NAME = 'listings'

let client: Meilisearch | null = null

export const getMeiliClient = () => {
  if (!client) {
    const config = useRuntimeConfig()
    client = new Meilisearch({
      host: config.meiliHost || 'http://localhost:7700',
      apiKey: config.meiliApiKey || undefined,
    })
  }

  return client
}

export const getListingsIndex = () => getMeiliClient().index(INDEX_NAME)

export const LISTINGS_INDEX = INDEX_NAME

export const ensureListingsIndex = async () => {
  const meili = getMeiliClient()

  try {
    await meili.getIndex(INDEX_NAME)
  } catch {
    await meili.createIndex(INDEX_NAME, { primaryKey: 'id' })
  }

  const index = getListingsIndex()

  await index.updateFilterableAttributes([
    'status',
    'city',
    'pricePerNight',
    'maxGuests',
    'bedrooms',
    'amenities',
    'accommodationTypes',
    'managedByTeam',
    '_geo',
  ])

  await index.updateSortableAttributes([
    'pricePerNight',
    'boostScore',
    'highlightScore',
    'cityPinScore',
  ])
}
