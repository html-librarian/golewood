import type { Amenity, CancellationPolicy, Listing } from '#shared/types/listing'
// Drizzle $inferSelect requires the table value, not a type-only import.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- listings table binding
import { listings } from '../db/schema'

type ListingRow = typeof listings.$inferSelect

export const mapListing = (row: ListingRow): Listing => ({
  id: row.id,
  hostId: row.hostId,
  kind: row.kind,
  propertyListingId: row.propertyListingId,
  title: row.title,
  description: row.description,
  status: row.status,
  pricePerNight: row.pricePerNight,
  city: row.city,
  address: row.address,
  latitude: row.latitude,
  longitude: row.longitude,
  maxGuests: row.maxGuests,
  extraGuestsOffered: row.extraGuestsOffered,
  maxGuestsWithExtra: row.maxGuestsWithExtra,
  extraGuestPricePerNight: row.extraGuestPricePerNight,
  bedrooms: row.bedrooms,
  amenities: (row.amenities ?? []) as Amenity[],
  accommodationType: row.accommodationType,
  houseRules: row.houseRules,
  checkInTime: row.checkInTime,
  checkOutTime: row.checkOutTime,
  minNights: row.minNights,
  cancellationPolicy: row.cancellationPolicy as CancellationPolicy,
  cleaningFee: row.cleaningFee,
  transferOffered: row.transferOffered,
  transferPrice: row.transferPrice,
  transferPriceOnRequest: row.transferPriceOnRequest,
  managedByTeam: row.managedByTeam,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})
