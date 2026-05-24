import type { ListingContacts } from '#shared/types/listing-contacts'

export interface ListingContactsFieldsProps {
  title?: string
  hint?: string
}

export type ListingContactsFormModel = Record<keyof ListingContacts, string>
