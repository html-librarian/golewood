import type { SearchParams, SearchResult } from '#shared/types/search'

const compactSearchQuery = (params: SearchParams) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === '') {
        return false
      }

      if (Array.isArray(value) && value.length === 0) {
        return false
      }

      return true
    }),
  )

export const useSearch = () => {
  const search = (params: SearchParams) =>
    $fetch<SearchResult>('/api/search', { query: compactSearchQuery(params) })

  return { search }
}
