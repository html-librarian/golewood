<script setup lang="ts">
import type { FormNumberStepperEmits, FormNumberStepperProps } from './types'

const props = withDefaults(defineProps<FormNumberStepperProps>(), {
  disabled: false,
  min: 1,
  max: 99,
  step: 1,
  variant: 'default',
})

const emit = defineEmits<FormNumberStepperEmits>()

const { t } = useI18n()

const numericValue = computed(() => {
  const parsed = Number(props.modelValue)

  if (Number.isNaN(parsed)) {
    return props.min
  }

  return parsed
})

const setValue = (next: number) => {
  const clamped = Math.min(props.max, Math.max(props.min, next))
  emit('update:modelValue', String(clamped))
}

const decrement = () => setValue(numericValue.value - props.step)
const increment = () => setValue(numericValue.value + props.step)

const controlClass = computed(() => {
  if (props.variant === 'plain') {
    return 'grid h-full min-h-11 w-full grid-cols-[2.75rem_1fr_2.75rem] border-0 bg-transparent'
  }

  return 'form-input grid min-h-11 grid-cols-[2.75rem_1fr_2.75rem] overflow-hidden p-0'
})

const buttonClass = 'inline-flex h-full min-h-11 w-full items-center justify-center text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-300 dark:hover:bg-stone-800'
</script>

<template>
  <FormField
    :id="id"
    :label="label"
    :error="error"
    :variant="variant"
  >
    <template #default="{ fieldId }">
      <div :class="controlClass">
        <button
          type="button"
          :class="buttonClass"
          :disabled="disabled || numericValue <= min"
          :aria-label="t('form.decrease')"
          @click="decrement"
        >
          <Icon
            name="ph:minus"
            class="size-4 shrink-0"
          />
        </button>

        <input
          :id="fieldId"
          type="text"
          inputmode="numeric"
          class="min-h-11 min-w-0 border-0 bg-transparent px-2 text-center text-stone-900 outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-100"
          :class="variant === 'plain' ? 'py-0' : 'py-2.5'"
          :value="modelValue"
          :disabled="disabled"
          readonly
        >

        <button
          type="button"
          :class="buttonClass"
          :disabled="disabled || numericValue >= max"
          :aria-label="t('form.increase')"
          @click="increment"
        >
          <Icon
            name="ph:plus"
            class="size-4 shrink-0"
          />
        </button>
      </div>
    </template>
  </FormField>
</template>
