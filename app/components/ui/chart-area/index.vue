<script setup lang="ts">
import { CHART_PERIOD_DAYS } from '#shared/types/chart'
import { sumSeries } from '#shared/utils/chart-buckets'
import {
  buildSmoothPath,
  buildYAxisTicks,
  chartAxisMax,
  CHART_HEIGHT,
  CHART_PAD,
  CHART_SVG_CLASS,
  CHART_WIDTH,
  indexFromChartX,
  pickXLabelIndices,
} from '#shared/utils/chart-layout'
import { formatPrice } from '#shared/utils/format'
import type { UiChartAreaProps } from './types'

const props = withDefaults(defineProps<UiChartAreaProps>(), {
  valueFormat: 'count',
  accentClass: 'text-brand-600 dark:text-brand-400',
})

const { locale, t } = useI18n()
const gradientId = `chart-area-${useId()}`

const hoverIndex = ref<number | null>(null)
const chartRoot = ref<HTMLElement | null>(null)

const periodTotal = computed(() => sumSeries(props.points))
const periodPeak = computed(() => Math.max(0, ...props.points.map(point => point.value)))
const periodAverage = computed(() =>
  props.points.length > 0
    ? periodTotal.value / props.points.length
    : 0,
)

const yMax = computed(() => chartAxisMax(periodPeak.value))
const yTicks = computed(() => buildYAxisTicks(periodPeak.value))
const hasData = computed(() => props.points.some(point => point.value > 0))
const useBars = computed(() => props.valueFormat === 'count')

const coords = computed(() => {
  const innerW = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right
  const innerH = CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom
  const lastIndex = Math.max(props.points.length - 1, 1)

  return props.points.map((point, index) => {
    const x = CHART_PAD.left + (index / lastIndex) * innerW
    const y = CHART_PAD.top + innerH - (point.value / yMax.value) * innerH

    return { x, y, point }
  })
})

const linePath = computed(() => buildSmoothPath(coords.value))

const dayBars = computed(() => {
  const innerW = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right
  const innerH = CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom
  const count = props.points.length
  const slotW = innerW / Math.max(count, 1)
  const barWidth = Math.min(slotW * 0.65, 28)

  return props.points.map((point, index) => {
    const x = CHART_PAD.left + index * slotW + (slotW - barWidth) / 2
    const height = yMax.value > 0 ? (point.value / yMax.value) * innerH : 0
    const y = CHART_PAD.top + innerH - height

    return {
      x,
      y,
      width: barWidth,
      height,
      centerX: x + barWidth / 2,
      point,
      index,
    }
  })
})

const showPointDots = computed(() => !useBars.value && props.points.length <= 14)

const areaPath = computed(() => {
  if (!coords.value.length) {
    return ''
  }

  const first = coords.value[0]
  const last = coords.value[coords.value.length - 1]
  const baseline = CHART_HEIGHT - CHART_PAD.bottom

  return `${linePath.value} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
})

const peakIndex = computed(() => {
  let index = 0
  let max = -1

  props.points.forEach((point, pointIndex) => {
    if (point.value > max) {
      max = point.value
      index = pointIndex
    }
  })

  return index
})

const formatValue = (value: number) =>
  props.valueFormat === 'price' ? formatPrice(value) : String(Math.round(value))

const formatAverage = (value: number) => {
  if (props.valueFormat === 'price') {
    return formatPrice(Math.round(value))
  }

  if (value > 0 && value < 10 && !Number.isInteger(value)) {
    return value.toLocaleString(locale.value, { maximumFractionDigits: 1 })
  }

  return String(Math.round(value))
}

const formatDayLabel = (iso: string, short = false) => {
  const date = new Date(`${iso}T12:00:00`)

  return date.toLocaleDateString(locale.value, short
    ? { day: 'numeric', month: 'short' }
    : { weekday: 'short', day: 'numeric', month: 'short' },
  )
}

const xLabelCoords = computed(() => {
  const indices = pickXLabelIndices(props.points.length)
  const innerW = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right
  const lastIndex = Math.max(props.points.length - 1, 1)

  return indices.map((index) => {
    const x = CHART_PAD.left + (index / lastIndex) * innerW
    return {
      x,
      label: formatDayLabel(props.points[index]?.date ?? '', true),
    }
  })
})

const activeIndex = computed(() => hoverIndex.value ?? peakIndex.value)

const activePoint = computed(() => {
  if (useBars.value) {
    const bar = dayBars.value[activeIndex.value]
    return bar
      ? { x: bar.centerX, y: bar.y, point: bar.point }
      : null
  }

  return coords.value[activeIndex.value] ?? null
})

const tooltipLeft = computed(() => {
  if (!activePoint.value) {
    return '50%'
  }

  return `${(activePoint.value.x / CHART_WIDTH) * 100}%`
})

const onPointerMove = (event: MouseEvent) => {
  const rect = chartRoot.value?.getBoundingClientRect()

  if (!rect) {
    return
  }

  hoverIndex.value = indexFromChartX(
    event.clientX,
    rect,
    props.points.length,
    CHART_PAD.left,
    CHART_PAD.right,
    CHART_WIDTH,
  )
}

const onPointerLeave = () => {
  hoverIndex.value = null
}
</script>

<template>
  <section class="surface-card p-5">
    <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
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
        v-if="hasData"
        class="grid grid-cols-3 gap-3 text-right text-xs"
      >
        <div>
          <dt class="text-stone-500 dark:text-stone-400">
            {{ t('chart.totalPeriod', { days: CHART_PERIOD_DAYS }) }}
          </dt>
          <dd
            class="mt-0.5 font-semibold tabular-nums text-stone-900 dark:text-stone-100"
            :class="accentClass"
          >
            {{ formatValue(periodTotal) }}
          </dd>
        </div>
        <div>
          <dt class="text-stone-500 dark:text-stone-400">
            {{ t('chart.perDay') }}
          </dt>
          <dd class="mt-0.5 font-semibold tabular-nums text-stone-800 dark:text-stone-200">
            {{ formatAverage(periodAverage) }}
          </dd>
        </div>
        <div>
          <dt class="text-stone-500 dark:text-stone-400">
            {{ t('chart.peak') }}
          </dt>
          <dd class="mt-0.5 font-semibold tabular-nums text-stone-800 dark:text-stone-200">
            {{ formatValue(periodPeak) }}
          </dd>
        </div>
      </dl>
    </div>

    <UiChartEmpty
      v-if="!hasData"
      :title="emptyLabel"
      :hint="t('chart.emptyHint')"
    />

    <div
      v-else
      ref="chartRoot"
      class="relative"
      @mouseleave="onPointerLeave"
    >
      <div
        v-if="activePoint"
        class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-md dark:border-stone-600 dark:bg-stone-800"
        :style="{ left: tooltipLeft, top: '0.25rem' }"
      >
        <p class="font-medium text-stone-900 dark:text-stone-100">
          {{ formatDayLabel(activePoint.point.date) }}
        </p>
        <p
          class="mt-0.5 tabular-nums font-semibold"
          :class="accentClass"
        >
          {{ formatValue(activePoint.point.value) }}
        </p>
      </div>

      <svg
        :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
        :class="CHART_SVG_CLASS"
        role="img"
        :aria-label="title"
        @mousemove="onPointerMove"
      >
        <defs>
          <linearGradient
            :id="gradientId"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stop-color="var(--color-brand-500)"
              stop-opacity="0.4"
            />
            <stop
              offset="100%"
              stop-color="var(--color-brand-500)"
              stop-opacity="0.03"
            />
          </linearGradient>
        </defs>

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

        <template v-if="useBars">
          <rect
            v-for="bar in dayBars"
            :key="bar.point.date"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="Math.max(bar.height, bar.point.value > 0 ? 4 : 0)"
            rx="4"
            class="fill-brand-600 transition-opacity dark:fill-brand-500"
            :class="bar.index === hoverIndex ? 'opacity-100' : 'opacity-85'"
          />
          <rect
            v-for="bar in dayBars"
            :key="`hit-${bar.point.date}`"
            :x="CHART_PAD.left + (bar.index / Math.max(props.points.length - 1, 1)) * (CHART_WIDTH - CHART_PAD.left - CHART_PAD.right) - 10"
            :y="CHART_PAD.top"
            width="20"
            :height="CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom"
            fill="transparent"
          />
        </template>
        <template v-else>
          <path
            :d="areaPath"
            :fill="`url(#${gradientId})`"
          />
          <path
            :d="linePath"
            fill="none"
            stroke="var(--color-brand-600)"
            stroke-width="2.5"
            stroke-linecap="round"
          />

          <line
            v-if="hoverIndex !== null && activePoint"
            :x1="activePoint.x"
            :y1="CHART_PAD.top"
            :x2="activePoint.x"
            :y2="CHART_HEIGHT - CHART_PAD.bottom"
            class="stroke-brand-400/60 dark:stroke-brand-500/50"
            stroke-width="1"
            stroke-dasharray="3 3"
          />
        </template>

        <template v-if="!useBars && showPointDots">
          <circle
            v-for="(coord, index) in coords"
            :key="coord.point.date"
            :cx="coord.x"
            :cy="coord.y"
            :r="index === peakIndex || index === hoverIndex ? 5 : 3"
            class="fill-white stroke-brand-600 transition-[r] dark:fill-stone-900"
            :class="index === hoverIndex ? 'stroke-[3px]' : 'stroke-[2px]'"
          />
        </template>
        <circle
          v-else-if="!useBars && activePoint"
          :cx="activePoint.x"
          :cy="activePoint.y"
          r="5"
          class="fill-white stroke-brand-600 stroke-[2px] dark:fill-stone-900"
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
