<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import type { UiCountUpProps } from './types'

const props = withDefaults(defineProps<UiCountUpProps>(), {
  decimals: 0,
  format: 'number',
})

const source = computed(() => props.value ?? null)
const { display } = useCountUp(source, { decimals: props.decimals })

const formatted = computed(() => {
  if (display.value === null) {
    return '—'
  }

  if (props.format === 'price') {
    return formatPrice(display.value)
  }

  return display.value.toLocaleString(undefined, {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  })
})
</script>

<template>
  <span class="tabular-nums">
    {{ formatted }}
  </span>
</template>
