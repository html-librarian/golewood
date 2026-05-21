export const geocodeService = {
  resolve: async (city: string, address: string) => {
    const query = [city, address].filter(Boolean).join(', ')

    if (!query.trim()) {
      return { latitude: 0, longitude: 0 }
    }

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
    })

    const results = await $fetch<Array<{ lat: string, lon: string }>>(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'golewood.ru/1.0',
        },
        timeout: 8_000,
      },
    )

    const first = results[0]

    if (!first) {
      return { latitude: 0, longitude: 0 }
    }

    return {
      latitude: Number.parseFloat(first.lat),
      longitude: Number.parseFloat(first.lon),
    }
  },
}
