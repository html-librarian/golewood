<script setup lang="ts">
import type { FormLabelProps } from './types'

withDefaults(defineProps<FormLabelProps>(), {
  required: false,
  as: 'p',
})
</script>

<template>
  <component
    :is="as"
    class="form-label"
    :for="as === 'label' ? fieldFor : undefined"
  >
    <slot /><span
      v-if="required"
      class="text-red-600 dark:text-red-400"
      aria-hidden="true"
    > *</span>
  </component>
</template>
