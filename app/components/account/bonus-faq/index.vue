<script setup lang="ts">
import type { AccountBonusFaqProps } from './types'

defineProps<AccountBonusFaqProps>()

const openHowTo = ref(true)
const openConditions = ref(false)
</script>

<template>
  <div class="space-y-3">
    <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-50"
        :aria-expanded="openHowTo"
        @click="openHowTo = !openHowTo"
      >
        {{ howToTitle }}
        <Icon
          :name="openHowTo ? 'ph:x' : 'ph:plus'"
          class="size-4 shrink-0 text-brand-600 dark:text-brand-400"
        />
      </button>
      <p
        v-if="openHowTo"
        class="border-t border-stone-200 px-4 py-3 text-sm leading-relaxed text-stone-600 dark:border-stone-800 dark:text-stone-400"
      >
        {{ howToBody }}
      </p>
    </section>

    <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-50"
        :aria-expanded="openConditions"
        @click="openConditions = !openConditions"
      >
        {{ conditionsTitle }}
        <Icon
          :name="openConditions ? 'ph:x' : 'ph:plus'"
          class="size-4 shrink-0 text-brand-600 dark:text-brand-400"
        />
      </button>
      <p
        v-if="openConditions"
        class="border-t border-stone-200 px-4 py-3 text-sm leading-relaxed text-stone-600 dark:border-stone-800 dark:text-stone-400"
      >
        {{ conditionsBody }}
      </p>
    </section>
  </div>
</template>
