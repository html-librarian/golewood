<script setup lang="ts">
import type { FormFieldProps } from './types'

const props = withDefaults(defineProps<FormFieldProps>(), {
  variant: 'default',
  required: false,
})

const fieldId = computed(() => props.id ?? `field-${useId()}`)
</script>

<template>
  <div
    class="flex w-full flex-col"
    :class="variant === 'plain' ? 'h-full min-h-18 gap-1' : 'gap-1.5'"
  >
    <label
      v-if="label"
      :for="fieldId"
      class="form-label"
      :class="variant === 'plain' ? 'px-3 pt-2.5 text-xs text-stone-500 dark:text-stone-400' : ''"
    >
      {{ label }}<span
        v-if="required"
        class="text-red-600 dark:text-red-400"
        aria-hidden="true"
      > *</span>
    </label>

    <div
      class="w-full"
      :class="variant === 'plain' ? 'flex flex-1 items-center' : ''"
    >
      <slot :field-id="fieldId" />
    </div>

    <p
      v-if="error"
      class="text-sm text-red-600 dark:text-red-400"
      :class="variant === 'plain' ? 'px-3' : ''"
    >
      {{ error }}
    </p>
  </div>
</template>
