<script setup lang="ts">
import type { ListingPropertyBookingFieldsProps } from './types'

defineProps<ListingPropertyBookingFieldsProps>()

const checkIn = defineModel<string>('checkIn', { required: true })
const checkOut = defineModel<string>('checkOut', { required: true })
const guests = defineModel<number>('guests', { required: true })

const guestsModel = computed({
  get: () => String(guests.value),
  set: (value: string) => {
    const parsed = Number(value)

    guests.value = Number.isNaN(parsed) ? 1 : Math.max(1, parsed)
  },
})
</script>

<template>
  <section
    class="surface-card space-y-4 p-4 md:p-5"
    data-testid="listing-property-booking-fields"
  >
    <h2 class="text-base font-semibold text-stone-900 dark:text-stone-100">
      {{ title }}
    </h2>

    <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
      <FormDateRange
        v-model:start="checkIn"
        v-model:end="checkOut"
        :label="$t('search.dates')"
        class="min-w-0 flex-1"
      />
      <div class="w-full shrink-0 lg:w-44">
        <FormNumberStepper
          v-model="guestsModel"
          :label="$t('search.guests')"
          :min="1"
          :max="16"
        />
      </div>
    </div>
  </section>
</template>
