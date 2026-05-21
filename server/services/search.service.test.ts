import { describe, expect, it, vi } from 'vitest'

const listingIds = Array.from({ length: 15 }, (_, index) => `listing-${index + 1}`)

vi.mock('../utils/db', () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(listingIds.map(id => ({ id }))),
      }),
    }),
  }),
}))

vi.mock('../utils/meili', () => ({
  ensureListingsIndex: vi.fn(),
  getListingsIndex: vi.fn(),
}))

vi.mock('./listing.service', () => ({
  listingService: { listPublished: vi.fn().mockResolvedValue([]) },
}))

vi.mock('./review.service', () => ({
  reviewService: { getSummariesForListings: vi.fn().mockResolvedValue({}) },
}))

vi.mock('./team-badge.service', () => ({
  teamBadgeService: { attachToListings: vi.fn().mockImplementation(items => Promise.resolve(items)) },
}))

vi.mock('./listing-news.service', () => ({
  listingNewsService: { attachCardMeta: vi.fn().mockImplementation(items => Promise.resolve(items)) },
}))

vi.mock('./promotion.service', () => ({
  promotionService: {
    attachPromotionMeta: vi.fn().mockImplementation(items => Promise.resolve(items)),
    attachHostVerified: vi.fn().mockImplementation(items => Promise.resolve(items)),
  },
}))

describe('searchService.search pagination', () => {
  it('returns different items per page', async () => {
    const { getListingsIndex } = await import('../utils/meili')
    const hits = Array.from({ length: 15 }, (_, index) => ({
      id: `listing-${index + 1}`,
      title: `Listing ${index + 1}`,
      city: 'Москва',
      address: 'ул. Тест',
      pricePerNight: 3000 + index,
      maxGuests: 2,
      bedrooms: 1,
      amenities: [],
      latitude: 55.75,
      longitude: 37.62,
      status: 'published',
    }))

    vi.mocked(getListingsIndex).mockReturnValue({
      search: vi.fn().mockResolvedValue({ hits }),
    } as never)

    const { searchService } = await import('./search.service')

    const page1 = await searchService.search({ page: 1, pageSize: 5 })
    const page2 = await searchService.search({ page: 2, pageSize: 5 })

    expect(page1.total).toBe(15)
    expect(page1.items).toHaveLength(5)
    expect(page2.items).toHaveLength(5)
    expect(page1.items[0]?.id).toBe('listing-1')
    expect(page2.items[0]?.id).toBe('listing-6')
    expect(page1.items.map(item => item.id)).not.toEqual(page2.items.map(item => item.id))
  })
})
