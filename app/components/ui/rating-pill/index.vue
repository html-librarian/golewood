<script setup lang="ts">
import type { UiRatingPillProps } from './types'

const props = withDefaults(defineProps<UiRatingPillProps>(), {
  size: 'md',
})

const rootClass = computed(() =>
  props.size === 'sm'
    ? 'gap-1 px-2 py-0.5 text-xs'
    : 'gap-1.5 px-2.5 py-1 text-sm',
)
</script>

<template>
  <span
    class="rating-pill inline-flex items-center font-semibold tabular-nums"
    :class="rootClass"
  >
    <Icon
      name="ph:star-fill"
      class="shrink-0 text-accent-400"
      :class="size === 'sm' ? 'size-3' : 'size-3.5'"
    />
    <span>{{ score }}</span>
    <span
      v-if="count !== undefined"
      class="font-medium text-white/85"
    >
      ({{ count }})
    </span>
  </span>
</template>
