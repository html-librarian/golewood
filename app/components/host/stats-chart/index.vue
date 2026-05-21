<script setup lang="ts">
import type { HostStatsChartProps } from './types'

const props = defineProps<HostStatsChartProps>()

const segments = computed(() =>
  props.segments.map(segment => ({
    ...segment,
    color: segment.color.startsWith('stroke-') || segment.color.startsWith('fill-')
      ? segment.color
      : segment.color.replace(/^bg-/, 'stroke-'),
  })),
)
</script>

<template>
  <UiChartDonut
    :title="title"
    :segments="segments"
    :total-label="totalLabel"
  />
</template>
