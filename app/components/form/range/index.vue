<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import type { FormRangeEmits, FormRangeProps } from './types'

const props = withDefaults(defineProps<FormRangeProps>(), {
  floor: 0,
  ceiling: 30_000,
  step: 500,
})

const emit = defineEmits<FormRangeEmits>()

const formatLabel = (value: number) =>
  props.formatValue ? props.formatValue(value) : formatPrice(value)

const readNumber = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

const minCurrent = computed(() => {
  if (!props.minValue) {
    return props.floor
  }

  return Math.min(props.ceiling, Math.max(props.floor, readNumber(props.minValue, props.floor)))
})

const maxCurrent = computed(() => {
  if (!props.maxValue) {
    return props.ceiling
  }

  return Math.min(props.ceiling, Math.max(props.floor, readNumber(props.maxValue, props.ceiling)))
})

const normalizedMin = computed(() => Math.min(minCurrent.value, maxCurrent.value))
const normalizedMax = computed(() => Math.max(minCurrent.value, maxCurrent.value))

const fillStyle = computed(() => {
  const span = props.ceiling - props.floor || 1
  const left = ((normalizedMin.value - props.floor) / span) * 100
  const right = ((normalizedMax.value - props.floor) / span) * 100

  return {
    left: `${left}%`,
    width: `${Math.max(0, right - left)}%`,
  }
})

const updateMin = (raw: number) => {
  const next = Math.min(raw, normalizedMax.value)
  emit('update:minValue', String(next))
}

const updateMax = (raw: number) => {
  const next = Math.max(raw, normalizedMin.value)
  emit('update:maxValue', String(next))
}
</script>

<template>
  <FormField
    :label="label"
    :error="error"
  >
    <template #default>
      <div class="space-y-3">
        <div class="flex items-center justify-between text-sm font-medium text-stone-700 dark:text-stone-300">
          <span>{{ formatLabel(normalizedMin) }}</span>
          <span>{{ formatLabel(normalizedMax) }}</span>
        </div>

        <div class="relative h-8">
          <div class="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-stone-200 dark:bg-stone-700" />
          <div
            class="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-500 dark:bg-brand-400"
            :style="fillStyle"
          />

          <input
            type="range"
            class="form-range-thumb z-10"
            :min="floor"
            :max="ceiling"
            :step="step"
            :value="normalizedMin"
            aria-label="Min"
            @input="updateMin(Number(($event.target as HTMLInputElement).value))"
          >
          <input
            type="range"
            class="form-range-thumb z-20"
            :min="floor"
            :max="ceiling"
            :step="step"
            :value="normalizedMax"
            aria-label="Max"
            @input="updateMax(Number(($event.target as HTMLInputElement).value))"
          >
        </div>
      </div>
    </template>
  </FormField>
</template>
