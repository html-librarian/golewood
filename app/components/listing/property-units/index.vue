<script setup lang="ts">
import { countNights } from '#shared/utils/dates'
import { formatPrice } from '#shared/utils/format'
import type { ListingPropertyUnitsProps } from './types'

const props = defineProps<ListingPropertyUnitsProps>()
const localePath = useLocalePath()

const { data: offers, pending } = await useAsyncData(
  () => `property-unit-offers-${props.propertyId}-${props.checkIn}-${props.checkOut}-${props.guests}`,
  () => $fetch<Array<{
    id: string
    title: string
    pricePerNight: number
    maxGuests: number
    bedrooms: number
    coverPhoto: { url: string } | null
    available: boolean
    nights: number | null
    totalPrice: number | null
  }>>(`/api/listings/${props.propertyId}/unit-offers`, {
    query: {
      checkIn: props.checkIn || undefined,
      checkOut: props.checkOut || undefined,
      guests: props.guests || undefined,
    },
  }),
  { watch: [() => props.checkIn, () => props.checkOut, () => props.guests] },
)

const bookLink = (unitId: string) => {
  const query: Record<string, string> = {}

  if (props.checkIn) {
    query.checkIn = props.checkIn
  }

  if (props.checkOut) {
    query.checkOut = props.checkOut
  }

  if (props.guests) {
    query.guests = String(props.guests)
  }

  return localePath({
    path: `/listings/${unitId}`,
    query,
  })
}
</script>

<template>
  <section
    class="space-y-4"
    data-testid="listing-property-units"
  >
    <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
      {{ labels.title }}
    </h2>

    <p
      v-if="!units.length"
      class="text-sm text-stone-600 dark:text-stone-400"
    >
      {{ labels.empty }}
    </p>

    <ul
      v-else
      class="space-y-4"
    >
      <li
        v-for="unit in (offers ?? units)"
        :key="unit.id"
        class="surface-card overflow-hidden"
      >
        <div class="flex flex-col gap-4 p-4 sm:flex-row">
          <div class="relative aspect-4/3 w-full shrink-0 sm:w-40">
            <ListingImage
              v-if="unit.coverPhoto"
              :src="unit.coverPhoto.url"
              :alt="unit.title"
              class="size-full rounded-xl object-cover"
            />
            <ListingImagePlaceholder
              v-else
              class="rounded-xl"
            />
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <h3 class="font-semibold text-brand-800 dark:text-brand-300">
              {{ unit.title }}
            </h3>
            <p class="text-sm text-stone-600 dark:text-stone-400">
              {{ unit.maxGuests }} {{ labels.guests }} · {{ unit.bedrooms }} {{ labels.bedrooms }}
            </p>
            <p
              v-if="'available' in unit && !unit.available && checkIn && checkOut"
              class="text-sm text-red-600 dark:text-red-400"
            >
              {{ labels.unavailable }}
            </p>
            <p
              v-else-if="'totalPrice' in unit && unit.totalPrice && checkIn && checkOut"
              class="text-lg font-semibold text-stone-900 dark:text-stone-50"
            >
              {{ formatPrice(unit.totalPrice) }}
              <span class="text-sm font-normal text-stone-500 dark:text-stone-400">
                {{ labels.forNights.replace('{n}', String(countNights(checkIn!, checkOut!))) }}
              </span>
            </p>
            <p
              v-else
              class="text-lg font-semibold text-stone-900 dark:text-stone-50"
            >
              {{ formatPrice(unit.pricePerNight) }}
              <span class="text-sm font-normal text-stone-500 dark:text-stone-400">{{ labels.pricePerNight }}</span>
            </p>
          </div>

          <div class="flex shrink-0 items-end sm:flex-col sm:justify-end">
            <NuxtLink
              v-if="!('available' in unit) || unit.available !== false"
              :to="bookLink(unit.id)"
            >
              <UiButton class="w-full sm:w-auto">
                {{ labels.book }}
              </UiButton>
            </NuxtLink>
            <UiButton
              v-else
              class="w-full sm:w-auto"
              disabled
            >
              {{ labels.book }}
            </UiButton>
          </div>
        </div>
      </li>
    </ul>

    <p
      v-if="pending"
      class="text-sm text-stone-500 dark:text-stone-400"
    >
      {{ labels.loadingOffers }}
    </p>
  </section>
</template>
