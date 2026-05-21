<script setup lang="ts">
import type { FormSelectEmits, FormSelectProps } from './types'

const props = withDefaults(defineProps<FormSelectProps>(), {
  disabled: false,
  variant: 'default',
  placeholder: '',
})

const emit = defineEmits<FormSelectEmits>()

const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
const open = ref(false)

const selectedLabel = computed(() => {
  const match = props.options.find(option => option.value === props.modelValue)
  return match?.label ?? props.placeholder ?? t('form.selectPlaceholder')
})

const triggerClass = computed(() => {
  if (props.variant === 'plain') {
    return 'flex w-full items-center justify-between gap-2 border-0 bg-transparent px-3 py-3 text-left text-stone-900 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-100'
  }

  return [
    'form-input flex w-full items-center justify-between gap-2 text-left',
    props.error ? 'form-input-error' : '',
  ]
})

const selectOption = (value: string) => {
  emit('update:modelValue', value)
  open.value = false
}

useClickOutside(root, () => {
  open.value = false
})
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
      <div
        ref="root"
        class="relative"
      >
        <button
          :id="fieldId"
          type="button"
          class="cursor-pointer"
          :class="triggerClass"
          :disabled="disabled"
          :aria-expanded="open"
          aria-haspopup="listbox"
          @click="open = !open"
        >
          <span :class="{ 'text-stone-400 dark:text-stone-500': !modelValue }">
            {{ selectedLabel }}
          </span>
          <Icon
            name="ph:caret-down"
            class="size-4 shrink-0 text-stone-500 transition dark:text-stone-400"
            :class="{ 'rotate-180': open }"
          />
        </button>

        <ul
          v-if="open"
          role="listbox"
          class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-(--shadow-card) dark:border-stone-700 dark:bg-stone-900"
        >
          <li
            v-for="option in options"
            :key="option.value || '__empty'"
            role="option"
            :aria-selected="modelValue === option.value"
          >
            <button
              type="button"
              class="flex w-full px-3 py-2 text-left text-sm transition hover:bg-stone-100 dark:hover:bg-stone-800"
              :class="modelValue === option.value
                ? 'bg-brand-50 font-medium text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                : 'text-stone-800 dark:text-stone-200'"
              @click="selectOption(option.value)"
            >
              {{ option.label }}
            </button>
          </li>
        </ul>
      </div>
    </template>
  </FormField>
</template>
