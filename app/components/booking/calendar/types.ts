export interface BookingCalendarProps {
  listingId: string
  checkIn: string
  checkOut: string
  readonly?: boolean
  showLegend?: boolean
  /** Хост: клик по сетке — диапазон блокировки / снятие ручного блока */
  hostManage?: boolean
}

export interface BookingCalendarEmits {
  'update:checkIn': [value: string]
  'update:checkOut': [value: string]
  rangeSelected: [start: string, end: string]
  removeBlock: [blockId: string]
}
