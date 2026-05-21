export interface ListingCheckInOutLabels {
  title: string
  checkIn: string
  checkOut: string
}

export interface ListingCheckInOutProps {
  checkInTime: string
  checkOutTime: string
  labels: ListingCheckInOutLabels
}
