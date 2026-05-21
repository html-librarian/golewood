<script setup lang="ts">
import type { CalendarDay } from '#shared/types/booking'
import { formatLocalIsoDate, isPastCalendarDate } from '#shared/utils/calendar'
import type { BookingCalendarEmits, BookingCalendarProps } from './types'

const props = withDefaults(defineProps<BookingCalendarProps>(), {
  showLegend: true,
})
const emit = defineEmits<BookingCalendarEmits>()

const { fetchCalendar } = useBookings()
const { fetchHostCalendar } = useListings()

const monthOffset = ref(0)

const monthStart = computed(() => {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() + monthOffset.value)
  return date
})

const range = computed(() => {
  const from = new Date(monthStart.value)
  const to = new Date(monthStart.value.getFullYear(), monthStart.value.getMonth() + 1, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
})

const loadDays = () => props.hostManage
  ? fetchHostCalendar(props.listingId, range.value.from, range.value.to)
  : fetchCalendar(props.listingId, range.value.from, range.value.to)

const { data: days, refresh } = await useAsyncData(
  () => `calendar-${props.hostManage ? 'host' : 'guest'}-${props.listingId}-${range.value.from}`,
  loadDays,
  { watch: [() => props.listingId, range, () => props.hostManage] },
)

watch(monthOffset, () => refresh())

const monthLabel = computed(() =>
  monthStart.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
)

const todayIso = formatLocalIsoDate()

const isDayDisabled = (day: CalendarDay) => {
  if (props.hostManage) {
    return isPastCalendarDate(day.date, todayIso)
      || day.unavailableReason === 'booking'
      || day.unavailableReason === 'import'
  }

  return isPastCalendarDate(day.date, todayIso) || !day.available
}

const selectDay = (day: CalendarDay) => {
  if (props.readonly && !props.hostManage) {
    return
  }

  if (props.hostManage && day.manualBlockId) {
    emit('removeBlock', day.manualBlockId)
    return
  }

  if (isDayDisabled(day)) {
    return
  }

  if (!props.checkIn || (props.checkIn && props.checkOut)) {
    emit('update:checkIn', day.date)
    emit('update:checkOut', '')
    return
  }

  if (day.date <= props.checkIn) {
    emit('update:checkIn', day.date)
    emit('update:checkOut', '')
    return
  }

  emit('update:checkOut', day.date)

  if (props.hostManage) {
    emit('rangeSelected', props.checkIn, day.date)
  }
}

const dayClass = (day: CalendarDay) => {
  const selected = day.date === props.checkIn || day.date === props.checkOut
  const inRange = props.checkIn && props.checkOut && day.date > props.checkIn && day.date < props.checkOut
  const isPast = isPastCalendarDate(day.date, todayIso)

  if (selected && !isPast) {
    return 'bg-brand-700 text-white dark:bg-brand-600'
  }

  if (inRange && !isPast) {
    return 'bg-brand-100 text-brand-900 dark:bg-brand-950 dark:text-brand-100'
  }

  if (isPast) {
    return 'cursor-not-allowed bg-stone-100/90 text-stone-400 dark:bg-stone-800/70 dark:text-stone-500'
  }

  if (props.hostManage) {
    if (day.unavailableReason === 'booking') {
      return 'cursor-not-allowed bg-red-50 text-red-700 line-through decoration-red-400 dark:bg-red-950/40 dark:text-red-300'
    }

    if (day.unavailableReason === 'import') {
      return 'cursor-not-allowed bg-amber-50 text-amber-800 dark:bg-amber-950/35 dark:text-amber-200'
    }

    if (day.unavailableReason === 'manual') {
      return 'bg-stone-200 text-stone-700 line-through decoration-stone-500 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600'
    }

    return 'text-stone-900 hover:bg-brand-50 dark:text-stone-100 dark:hover:bg-brand-950/50'
  }

  if (!day.available) {
    return 'cursor-not-allowed bg-stone-100 text-stone-400 line-through decoration-stone-400 dark:bg-stone-800/80 dark:text-stone-500 dark:decoration-stone-500'
  }

  if (props.readonly) {
    return 'text-stone-900 dark:text-stone-100'
  }

  return 'text-stone-900 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800'
}

const legendKey = computed(() => {
  if (props.hostManage) {
    return 'hostCalendarHint'
  }

  return props.readonly ? null : 'calendarUnavailableHint'
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <button
        type="button"
        class="rounded-lg px-2 py-1 text-sm text-stone-600 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
        @click="monthOffset--"
      >
        ‹
      </button>
      <p class="text-sm font-medium capitalize text-stone-900 dark:text-stone-100">
        {{ monthLabel }}
      </p>
      <button
        type="button"
        class="rounded-lg px-2 py-1 text-sm text-stone-600 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
        @click="monthOffset++"
      >
        ›
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-xs">
      <button
        v-for="day in days ?? []"
        :key="day.date"
        type="button"
        class="rounded-lg py-2 text-sm transition"
        :class="dayClass(day)"
        :disabled="!hostManage && (readonly || isDayDisabled(day))"
        data-testid="calendar-day"
        @click="selectDay(day)"
      >
        {{ day.date.slice(-2) }}
      </button>
    </div>

    <p
      v-if="showLegend && legendKey"
      class="text-xs text-stone-500 dark:text-stone-400"
    >
      {{ $t(`booking.${legendKey}`) }}
    </p>
  </div>
</template>
