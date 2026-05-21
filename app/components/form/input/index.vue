<script setup lang="ts">
import type { FormInputEmits, FormInputProps } from './types'

const props = withDefaults(defineProps<FormInputProps>(), {
  type: 'text',
  disabled: false,
  variant: 'default',
  required: false,
})

const inputClass = computed(() => {
  if (props.variant === 'plain') {
    return [
      'w-full border-0 bg-transparent px-3 py-3 text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-100 dark:placeholder:text-stone-500',
      props.error ? 'text-red-600 dark:text-red-400' : '',
    ]
  }

  return ['form-input', props.error ? 'form-input-error' : '']
})

const emit = defineEmits<FormInputEmits>()

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <FormField
    :id="id"
    :label="label"
    :error="error"
    :variant="variant"
    :required="required"
  >
    <template #default="{ fieldId }">
      <input
        :id="fieldId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :data-testid="testId"
        :class="inputClass"
        @input="onInput"
      >
    </template>
  </FormField>
</template>
