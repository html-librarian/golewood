export interface SearchEmptyStateProps {
  hasActiveFilters: boolean
  title: string
  description: string
  clearFiltersLabel: string
  resetSearchLabel: string
  tipDates: string
  tipCity: string
}

export interface SearchEmptyStateEmits {
  clearFilters: []
}
