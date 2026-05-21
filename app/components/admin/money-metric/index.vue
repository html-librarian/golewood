<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import type { AdminMoneyMetricProps } from './types'

const props = defineProps<AdminMoneyMetricProps>()
</script>

<template>
  <article class="surface-card p-4">
    <div class="mb-3 flex items-start justify-between gap-2">
      <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">
        {{ props.label }}
      </h3>
      <span
        v-if="props.comingSoon"
        class="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600 dark:bg-stone-800 dark:text-stone-400"
      >
        {{ props.comingSoonLabel }}
      </span>
    </div>
    <dl class="grid gap-3 sm:grid-cols-2">
      <div>
        <dt class="text-xs text-stone-500 dark:text-stone-400">
          {{ props.allTimeLabel }}
        </dt>
        <dd class="mt-0.5 text-lg font-semibold tabular-nums text-stone-900 dark:text-stone-50">
          {{ formatPrice(props.period.allTimeRub) }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-stone-500 dark:text-stone-400">
          {{ props.last30Label }}
        </dt>
        <dd class="mt-0.5 text-lg font-semibold tabular-nums text-brand-800 dark:text-brand-200">
          {{ formatPrice(props.period.last30DaysRub) }}
        </dd>
      </div>
    </dl>
  </article>
</template>
