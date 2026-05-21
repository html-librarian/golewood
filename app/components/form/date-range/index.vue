<script setup lang="ts">
import {
  addMonths,
  formatDisplayDate,
  formatLocalIsoDate,
  getMonthGrid,
  parseIsoDate,
} from '#shared/utils/calendar'
import type { FormDateRangeEmits, FormDateRangeProps } from './types'

const props = withDefaults(defineProps<FormDateRangeProps>(), {
  disabled: false,
  variant: 'default',
})

const minSelectable = computed(() => props.minDate ?? formatLocalIsoDate())

const emit = defineEmits<FormDateRangeEmits>()

const { locale, t } = useI18n()
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const open = ref(false)
const panelStyle = ref<{ top: string, left: string, width: string }>({
  top: '0px',
  left: '0px',
  width: '36rem',
})

const startOfView = () => {
  const base = props.start ? parseIsoDate(props.start) : new Date()
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))
}

const viewMonth = ref(startOfView())

const monthA = computed(() => viewMonth.value)
const monthB = computed(() => addMonths(viewMonth.value, 1))

const weekdayLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'ru-RU', {
    weekday: 'short',
  })

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(2024, 0, index + 1))
    return formatter.format(date)
  })
})

const monthTitle = (date: Date) =>
  date.toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'ru-RU', {
    month: 'long',
    year: 'numeric',
  })

const displayValue = computed(() => {
  if (props.start && props.end) {
    return `${formatDisplayDate(props.start, locale.value)} — ${formatDisplayDate(props.end, locale.value)}`
  }

  if (props.start) {
    return formatDisplayDate(props.start, locale.value)
  }

  return props.placeholder ?? t('form.datesPlaceholder')
})

const triggerClass = computed(() => {
  if (props.variant === 'plain') {
    return 'flex w-full min-h-[2.75rem] items-center gap-2 border-0 bg-transparent px-3 text-left text-stone-900 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-100'
  }

  return [
    'form-input flex w-full items-center gap-2 text-left',
    props.error ? 'form-input-error' : '',
  ]
})

const isInRange = (iso: string) => {
  if (!props.start || !props.end) {
    return false
  }

  const day = parseIsoDate(iso).getTime()
  return day >= parseIsoDate(props.start).getTime() && day <= parseIsoDate(props.end).getTime()
}

const isSelected = (iso: string) => iso === props.start || iso === props.end

const dayClass = (iso: string, inMonth: boolean, isPast: boolean) => {
  const selected = isSelected(iso)
  const inRange = isInRange(iso)

  if (isPast) {
    return [
      'size-9 rounded-lg text-sm transition cursor-not-allowed',
      inMonth
        ? 'bg-stone-100/90 text-stone-400 dark:bg-stone-800/70 dark:text-stone-500'
        : 'text-stone-300 opacity-50 dark:text-stone-600',
      selected ? 'line-through decoration-stone-400 dark:decoration-stone-500' : '',
    ]
  }

  return [
    'size-9 rounded-lg text-sm transition text-stone-800 dark:text-stone-200',
    !inMonth ? 'text-stone-300 dark:text-stone-600' : 'hover:bg-stone-100 dark:hover:bg-stone-800',
    inRange && !selected ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/60 dark:text-brand-200' : '',
    selected ? 'bg-brand-600 font-semibold text-white dark:bg-brand-500' : '',
  ]
}

const onDayClick = (iso: string, isPast: boolean) => {
  if (props.disabled || isPast) {
    return
  }

  if (!props.start || (props.start && props.end)) {
    emit('update:start', iso)
    emit('update:end', '')
    return
  }

  if (parseIsoDate(iso) <= parseIsoDate(props.start)) {
    emit('update:start', iso)
    emit('update:end', '')
    return
  }

  emit('update:end', iso)
  open.value = false
}

const shiftMonth = (delta: number) => {
  viewMonth.value = addMonths(viewMonth.value, delta)
}

watch(() => props.start, () => {
  if (props.start) {
    viewMonth.value = new Date(Date.UTC(
      parseIsoDate(props.start).getUTCFullYear(),
      parseIsoDate(props.start).getUTCMonth(),
      1,
    ))
  }
})

const updatePanelPosition = () => {
  if (!root.value) {
    return
  }

  const rect = root.value.getBoundingClientRect()
  const panelWidth = Math.min(576, window.innerWidth - 16)
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - panelWidth - 8))

  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${left}px`,
    width: `${panelWidth}px`,
  }
}

const onDocumentClick = (event: MouseEvent) => {
  const target = event.target as Node

  if (root.value?.contains(target) || panel.value?.contains(target)) {
    return
  }

  open.value = false
}

const toggleOpen = () => {
  open.value = !open.value
}

watch(open, (isOpen) => {
  if (!import.meta.client) {
    return
  }

  if (isOpen) {
    nextTick(() => {
      updatePanelPosition()
      document.addEventListener('click', onDocumentClick, true)
    })
    window.addEventListener('scroll', updatePanelPosition, true)
    window.addEventListener('resize', updatePanelPosition)
  } else {
    window.removeEventListener('scroll', updatePanelPosition, true)
    window.removeEventListener('resize', updatePanelPosition)
    document.removeEventListener('click', onDocumentClick, true)
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  window.removeEventListener('scroll', updatePanelPosition, true)
  window.removeEventListener('resize', updatePanelPosition)
  document.removeEventListener('click', onDocumentClick, true)
})
</script>

<template>
  <FormField
    :id="id"
    :label="label"
    :error="error"
    :variant="variant"
  >
    <template #default="{ fieldId }">
      <div
        ref="root"
        class="relative w-full"
      >
        <button
          :id="fieldId"
          type="button"
          class="cursor-pointer"
          :class="triggerClass"
          :disabled="disabled"
          :aria-expanded="open"
          @click.stop="toggleOpen()"
        >
          <Icon
            name="ph:calendar-blank-duotone"
            class="size-5 shrink-0 text-brand-600 dark:text-brand-400"
          />
          <span
            class="truncate"
            :class="{ 'text-stone-400 dark:text-stone-500': !start }"
          >
            {{ displayValue }}
          </span>
        </button>

        <Teleport to="body">
          <div
            v-if="open"
            ref="panel"
            class="fixed z-200 max-w-[calc(100vw-1rem)] rounded-2xl border border-stone-200 bg-white p-4 shadow-(--shadow-float) dark:border-stone-700 dark:bg-stone-900"
            :style="panelStyle"
          >
            <div class="mb-3 flex items-center justify-between">
              <button
                type="button"
                class="rounded-lg p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                :aria-label="t('form.prevMonth')"
                @click="shiftMonth(-1)"
              >
                <Icon
                  name="ph:caret-left"
                  class="size-5"
                />
              </button>
              <p class="text-sm font-medium text-stone-700 dark:text-stone-300">
                {{ t('form.pickDates') }}
              </p>
              <button
                type="button"
                class="rounded-lg p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                :aria-label="t('form.nextMonth')"
                @click="shiftMonth(1)"
              >
                <Icon
                  name="ph:caret-right"
                  class="size-5"
                />
              </button>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div
                v-for="monthDate in [monthA, monthB]"
                :key="monthDate.toISOString()"
              >
                <p class="mb-2 text-center text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {{ monthTitle(monthDate) }}
                </p>

                <div class="mb-1 grid grid-cols-7 gap-1">
                  <span
                    v-for="weekday in weekdayLabels"
                    :key="weekday"
                    class="text-center text-[10px] font-medium uppercase text-stone-400 dark:text-stone-500"
                  >
                    {{ weekday }}
                  </span>
                </div>

                <div class="grid grid-cols-7 gap-1">
                  <button
                    v-for="cell in getMonthGrid(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), minSelectable)"
                    :key="`${monthDate.toISOString()}-${cell.iso}`"
                    type="button"
                    :disabled="cell.isPast"
                    :class="dayClass(cell.iso, cell.inMonth, cell.isPast)"
                    @click="onDayClick(cell.iso, cell.isPast)"
                  >
                    {{ cell.day }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Teleport>
      </div>
    </template>
  </FormField>
</template>
