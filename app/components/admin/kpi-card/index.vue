<script setup lang="ts">
import type { AdminKpiCardProps } from './types'

const props = defineProps<AdminKpiCardProps>()
const localePath = useLocalePath()

const target = computed(() => (props.to ? localePath(props.to) : undefined))
</script>

<template>
  <component
    :is="target ? 'NuxtLink' : 'div'"
    :to="target"
    class="surface-card flex flex-col gap-2 p-4 transition"
    :class="[
      target ? 'hover:shadow-(--shadow-card-hover)' : '',
      accent ? 'border-brand-300/60 ring-1 ring-brand-200/50 dark:border-brand-700/50 dark:ring-brand-900/40' : '',
    ]"
  >
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm font-medium text-stone-600 dark:text-stone-400">
        {{ label }}
      </p>
      <Icon
        v-if="icon"
        :name="icon"
        class="size-5 shrink-0 text-brand-600 dark:text-brand-400"
      />
    </div>
    <p class="font-display text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
      {{ value }}
    </p>
    <p
      v-if="hint"
      class="text-xs text-stone-500 dark:text-stone-400"
    >
      {{ hint }}
    </p>
  </component>
</template>
