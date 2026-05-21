<script setup lang="ts">
import { formatPhoneDisplay, normalizePhone } from '#shared/utils/phone'
import type { FormPhoneInputEmits, FormPhoneInputProps } from './types'

const props = withDefaults(defineProps<FormPhoneInputProps>(), {
  disabled: false,
  placeholder: '+7 (999) 123-45-67',
  required: false,
})

const emit = defineEmits<FormPhoneInputEmits>()

const displayValue = computed(() => formatPhoneDisplay(props.modelValue))

const onInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value
  emit('update:modelValue', normalizePhone(raw))
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
      <input
        :id="fieldId"
        type="tel"
        inputmode="tel"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        autocomplete="tel"
        class="form-input"
        :class="{ 'form-input-error': !!error }"
        @input="onInput"
      >
    </template>
  </FormField>
</template>
