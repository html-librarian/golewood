<script setup lang="ts">
import type { FormCheckboxEmits, FormCheckboxProps } from './types'

const props = withDefaults(defineProps<FormCheckboxProps>(), {
  disabled: false,
})

const emit = defineEmits<FormCheckboxEmits>()

const controlId = computed(() => props.id ?? `checkbox-${useId()}`)

const toggle = () => {
  if (props.disabled) {
    return
  }

  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label
    class="grid cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-x-2.5"
    :class="disabled ? 'cursor-not-allowed opacity-60' : ''"
  >
    <button
      :id="controlId"
      type="button"
      role="checkbox"
      class="flex size-5 shrink-0 items-center justify-center justify-self-center rounded-md border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      :class="modelValue
        ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
        : 'border-stone-300 bg-white text-transparent hover:border-stone-400 dark:border-stone-600 dark:bg-stone-900 dark:hover:border-stone-500'"
      :aria-checked="modelValue"
      :disabled="disabled"
      @click.prevent="toggle"
    >
      <Icon
        v-if="modelValue"
        name="ph:check-bold"
        class="size-3.5"
        aria-hidden="true"
      />
    </button>

    <span
      v-if="label"
      class="col-start-2 min-w-0 text-sm leading-snug text-stone-700 dark:text-stone-300"
    >
      {{ label }}
    </span>

    <span
      v-else-if="$slots.default"
      class="col-start-2 flex min-w-0 items-center text-sm leading-snug text-stone-700 dark:text-stone-300"
    >
      <slot />
    </span>
  </label>
</template>
