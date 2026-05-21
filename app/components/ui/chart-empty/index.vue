<script setup lang="ts">
defineProps<{
  title: string
  hint: string
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/80 px-6 py-12 text-center dark:border-stone-700 dark:bg-stone-900/40"
  >
    <Icon
      name="ph:chart-line-up-duotone"
      class="mb-3 size-10 text-stone-300 dark:text-stone-600"
    />
    <p class="text-sm font-medium text-stone-700 dark:text-stone-300">
      {{ title }}
    </p>
    <p class="mt-1 max-w-xs text-xs leading-relaxed text-stone-500 dark:text-stone-400">
      {{ hint }}
    </p>
  </div>
</template>
