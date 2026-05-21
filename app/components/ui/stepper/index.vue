<script setup lang="ts">
import type { UiStepperEmits, UiStepperProps } from './types'

const props = withDefaults(defineProps<UiStepperProps>(), {
  clickable: false,
})

const emit = defineEmits<UiStepperEmits>()

const stepClass = (index: number) => {
  const stepNumber = index + 1
  const isCurrent = props.current === stepNumber
  const isPast = stepNumber < props.current

  if (isCurrent) {
    return 'chip-active'
  }

  if (isPast) {
    return 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
  }

  return 'chip-inactive'
}

const isEnabled = (index: number) => props.isStepEnabled?.(index + 1) ?? true

const onSelect = (index: number) => {
  const stepNumber = index + 1

  if (!props.clickable || !isEnabled(index) || stepNumber === props.current) {
    return
  }

  emit('select', stepNumber)
}
</script>

<template>
  <ol class="flex flex-wrap gap-2">
    <li
      v-for="(step, index) in steps"
      :key="step.label"
    >
      <button
        v-if="clickable"
        type="button"
        class="chip whitespace-nowrap transition"
        :class="[
          stepClass(index),
          isEnabled(index) ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed opacity-50',
        ]"
        :disabled="!isEnabled(index)"
        :aria-current="current === index + 1 ? 'step' : undefined"
        @click="onSelect(index)"
      >
        <span class="mr-1.5 font-semibold">{{ index + 1 }}.</span>
        {{ step.label }}
      </button>
      <span
        v-else
        class="chip whitespace-nowrap"
        :class="stepClass(index)"
      >
        <span class="mr-1.5 font-semibold">{{ index + 1 }}.</span>
        {{ step.label }}
      </span>
    </li>
  </ol>
</template>
