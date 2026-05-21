<script setup lang="ts">
import { CHART_PERIOD_DAYS } from '#shared/types/chart'
import { sumSeries } from '#shared/utils/chart-buckets'
import {
  buildYAxisTicks,
  CHART_HEIGHT,
  CHART_PAD,
  CHART_SVG_CLASS,
  CHART_WIDTH,
  indexFromChartX,
  chartAxisMax,
  pickXLabelIndices,
} from '#shared/utils/chart-layout'
import { formatPrice } from '#shared/utils/format'
import type { UiChartStackedBarProps } from './types'

const props = withDefaults(defineProps<UiChartStackedBarProps>(), {
  valueFormat: 'price',
})

const { locale, t } = useI18n()

const hoverIndex = ref<number | null>(null)
const chartRoot = ref<HTMLElement | null>(null)

const dayCount = computed(() => props.series[0]?.points.length ?? 0)

const totalsByDay = computed(() => {
  if (!dayCount.value) {
    return []
  }

  return Array.from({ length: dayCount.value }, (_, index) =>
    props.series.reduce((sum, item) => sum + (item.points[index]?.value ?? 0), 0),
  )
})

const seriesTotals = computed(() =>
  props.series.map(item => ({
    label: item.label,
    color: item.color,
    total: sumSeries(item.points),
  })),
)

const periodTotal = computed(() =>
  totalsByDay.value.reduce((sum, value) => sum + value, 0),
)

const peakDayIndex = computed(() => {
  let index = 0
  let max = 0

  totalsByDay.value.forEach((total, dayIndex) => {
    if (total > max) {
      max = total
      index = dayIndex
    }
  })

  return index
})

const periodPeak = computed(() => Math.max(0, ...totalsByDay.value))
const yMax = computed(() => chartAxisMax(periodPeak.value))
const yTicks = computed(() => buildYAxisTicks(periodPeak.value))
const hasTimeline = computed(() => dayCount.value > 0)
const hasValues = computed(() => totalsByDay.value.some(total => total > 0))

const bars = computed(() => {
  const innerW = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right
  const innerH = CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom
  const slotW = innerW / Math.max(dayCount.value, 1)
  const barWidth = slotW * 0.55

  return totalsByDay.value.map((total, dayIndex) => {
    const x = CHART_PAD.left + dayIndex * slotW + (slotW - barWidth) / 2
    let stackY = CHART_PAD.top + innerH

    const segments = props.series.map((item) => {
      const value = item.points[dayIndex]?.value ?? 0
      const segmentH = yMax.value > 0 ? (value / yMax.value) * innerH : 0
      stackY -= segmentH

      return {
        label: item.label,
        color: item.color,
        value,
        y: stackY,
        h: segmentH,
      }
    }).filter(segment => segment.h > 0.5)

    return { x, width: barWidth, total, segments, dayIndex }
  })
})

const formatValue = (value: number) =>
  props.valueFormat === 'price' ? formatPrice(value) : String(value)

const formatDayLabel = (iso: string, short = false) => {
  const date = new Date(`${iso}T12:00:00`)

  return date.toLocaleDateString(locale.value, short
    ? { day: 'numeric', month: 'short' }
    : { weekday: 'short', day: 'numeric', month: 'short' },
  )
}

const xLabelCoords = computed(() => {
  const points = props.series[0]?.points ?? []
  const indices = pickXLabelIndices(points.length)
  const innerW = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right
  const lastIndex = Math.max(points.length - 1, 1)

  return indices.map((index) => {
    const x = CHART_PAD.left + (index / lastIndex) * innerW
    return {
      x,
      label: formatDayLabel(points[index]?.date ?? '', true),
    }
  })
})

const activeDayIndex = computed(() => hoverIndex.value ?? peakDayIndex.value)

const activeDay = computed(() => {
  const index = activeDayIndex.value
  const date = props.series[0]?.points[index]?.date

  if (!date) {
    return null
  }

  return {
    date,
    total: totalsByDay.value[index] ?? 0,
    segments: props.series
      .map(item => ({
        label: item.label,
        color: item.color,
        value: item.points[index]?.value ?? 0,
      }))
      .filter(segment => segment.value > 0),
  }
})

const tooltipLeft = computed(() => {
  const bar = bars.value[activeDayIndex.value]

  if (!bar) {
    return '50%'
  }

  return `${((bar.x + bar.width / 2) / CHART_WIDTH) * 100}%`
})

const onPointerMove = (event: MouseEvent) => {
  const rect = chartRoot.value?.getBoundingClientRect()

  if (!rect) {
    return
  }

  hoverIndex.value = indexFromChartX(
    event.clientX,
    rect,
    dayCount.value,
    CHART_PAD.left,
    CHART_PAD.right,
    CHART_WIDTH,
  )
}

const onPointerLeave = () => {
  hoverIndex.value = null
}

const fillClass = (color: string) =>
  color.startsWith('fill-') ? color : color.replace(/^bg-/, 'fill-')

const legendSwatchClass = (color: string) =>
  color.startsWith('bg-') ? color : color.replace(/^fill-/, 'bg-')
</script>

<template>
  <section class="surface-card p-5">
    <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0 space-y-1">
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ title }}
        </h2>
        <p
          v-if="subtitle"
          class="text-sm text-stone-600 dark:text-stone-400"
        >
          {{ subtitle }}
        </p>
      </div>

      <dl
        v-if="hasValues"
        class="shrink-0 text-right text-xs"
      >
        <dt class="text-stone-500 dark:text-stone-400">
          {{ t('chart.totalPeriod', { days: CHART_PERIOD_DAYS }) }}
        </dt>
        <dd class="mt-0.5 font-semibold tabular-nums text-brand-700 dark:text-brand-300">
          {{ formatValue(periodTotal) }}
        </dd>
      </dl>
    </div>

    <ul
      v-if="hasTimeline"
      class="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-600 dark:text-stone-400"
    >
      <li
        v-for="item in seriesTotals"
        :key="item.label"
        class="flex items-center gap-2"
      >
        <span
          class="size-2.5 shrink-0 rounded-sm"
          :class="legendSwatchClass(item.color)"
        />
        <span>{{ item.label }}</span>
        <span class="font-medium tabular-nums text-stone-800 dark:text-stone-200">
          {{ formatValue(item.total) }}
        </span>
      </li>
    </ul>

    <UiChartEmpty
      v-if="!hasTimeline"
      :title="emptyLabel"
      :hint="t('chart.emptyHintRevenue')"
    />

    <div
      v-else
      ref="chartRoot"
      class="relative"
      @mouseleave="onPointerLeave"
    >
      <p
        v-if="!hasValues"
        class="mb-3 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600 dark:bg-stone-900/60 dark:text-stone-400"
      >
        {{ t('chart.noValuesInPeriod') }}
      </p>
      <div
        v-if="activeDay"
        class="pointer-events-none absolute z-10 max-w-56 -translate-x-1/2 -translate-y-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-md dark:border-stone-600 dark:bg-stone-800"
        :style="{ left: tooltipLeft, top: '0.25rem' }"
      >
        <p class="font-medium text-stone-900 dark:text-stone-100">
          {{ formatDayLabel(activeDay.date) }}
        </p>
        <p class="mt-0.5 font-semibold tabular-nums text-brand-700 dark:text-brand-300">
          {{ formatValue(activeDay.total) }}
        </p>
        <ul
          v-if="activeDay.segments.length"
          class="mt-1.5 space-y-0.5 border-t border-stone-100 pt-1.5 dark:border-stone-700"
        >
          <li
            v-for="segment in activeDay.segments"
            :key="segment.label"
            class="flex justify-between gap-3 tabular-nums text-stone-600 dark:text-stone-400"
          >
            <span>{{ segment.label }}</span>
            <span>{{ formatValue(segment.value) }}</span>
          </li>
        </ul>
      </div>

      <svg
        :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
        :class="CHART_SVG_CLASS"
        role="img"
        :aria-label="title"
        @mousemove="onPointerMove"
      >
        <g
          v-for="tick in yTicks"
          :key="tick"
        >
          <line
            :x1="CHART_PAD.left"
            :y1="CHART_PAD.top + (CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom) * (1 - tick / yMax)"
            :x2="CHART_WIDTH - CHART_PAD.right"
            :y2="CHART_PAD.top + (CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom) * (1 - tick / yMax)"
            class="stroke-stone-200/80 dark:stroke-stone-700/80"
            stroke-width="1"
            :stroke-dasharray="tick === 0 ? undefined : '4 4'"
          />
          <text
            :x="CHART_PAD.left - 8"
            :y="CHART_PAD.top + (CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom) * (1 - tick / yMax) + 4"
            text-anchor="end"
            class="fill-stone-400 text-[10px] tabular-nums dark:fill-stone-500"
          >
            {{ formatValue(tick) }}
          </text>
        </g>

        <g
          v-for="bar in bars"
          :key="bar.dayIndex"
        >
          <rect
            v-for="(segment, segIndex) in bar.segments"
            :key="segIndex"
            :x="bar.x"
            :y="segment.y"
            :width="bar.width"
            :height="segment.h"
            rx="3"
            :class="[
              'transition-opacity duration-150',
              fillClass(segment.color),
              bar.dayIndex === hoverIndex ? 'opacity-100' : 'opacity-90',
            ]"
          />
        </g>

        <rect
          v-for="bar in bars"
          :key="`hit-${bar.dayIndex}`"
          :x="CHART_PAD.left + (bar.dayIndex / Math.max(dayCount - 1, 1)) * (CHART_WIDTH - CHART_PAD.left - CHART_PAD.right) - 8"
          :y="CHART_PAD.top"
          width="16"
          :height="CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom"
          fill="transparent"
        />
      </svg>

      <div class="relative mt-1 h-5">
        <span
          v-for="tick in xLabelCoords"
          :key="tick.label"
          class="absolute -translate-x-1/2 text-[10px] tabular-nums text-stone-500 dark:text-stone-400"
          :style="{ left: `${(tick.x / CHART_WIDTH) * 100}%` }"
        >
          {{ tick.label }}
        </span>
      </div>
    </div>
  </section>
</template>
