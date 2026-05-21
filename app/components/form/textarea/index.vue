<script setup lang="ts">
import type { FormTextareaEmits, FormTextareaProps } from './types'

withDefaults(defineProps<FormTextareaProps>(), {
  disabled: false,
  rows: 4,
  required: false,
})

const emit = defineEmits<FormTextareaEmits>()

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <FormField
    :id="id"
    :label="label"
    :error="error"
    :required="required"
  >
    <template #default="{ fieldId }">
      <textarea
        :id="fieldId"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :rows="rows"
        class="form-input min-h-24 resize-y"
        :class="{ 'form-input-error': !!error }"
        @input="onInput"
      />
    </template>
  </FormField>
</template>
