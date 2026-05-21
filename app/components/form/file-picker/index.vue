<script setup lang="ts">
import type { FormFilePickerEmits, FormFilePickerProps } from './types'

const props = withDefaults(defineProps<FormFilePickerProps>(), {
  modelValue: () => [],
  accept: '.pdf,.doc,.docx,image/jpeg,image/png,image/webp',
  maxFiles: 5,
  disabled: false,
})

const emit = defineEmits<FormFilePickerEmits>()

const inputRef = ref<HTMLInputElement | null>(null)
const inputId = computed(() => props.id ?? `file-picker-${useId()}`)

const onPick = (event: Event) => {
  const input = event.target as HTMLInputElement
  const picked = [...(input.files ?? [])]

  if (!picked.length) {
    return
  }

  const merged = [...props.modelValue, ...picked].slice(0, props.maxFiles)
  emit('update:modelValue', merged)

  if (inputRef.value) {
    inputRef.value.value = ''
  }
}

const removeFile = (index: number) => {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

const canAddMore = computed(() => props.modelValue.length < props.maxFiles)
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <label
      v-if="label"
      :for="inputId"
      class="form-label"
    >
      {{ label }}
    </label>

    <p
      v-if="hint"
      class="text-xs leading-relaxed text-stone-500 dark:text-stone-400"
    >
      {{ hint }}
    </p>

    <label
      v-if="canAddMore"
      class="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-5 text-center transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-stone-600 dark:bg-stone-950 dark:hover:border-brand-600 dark:hover:bg-brand-950/30"
      :class="{ 'pointer-events-none opacity-60': disabled }"
    >
      <input
        :id="inputId"
        ref="inputRef"
        type="file"
        :accept="accept"
        multiple
        class="sr-only"
        :disabled="disabled"
        @change="onPick"
      >
      <Icon
        name="ph:paperclip-duotone"
        class="size-7 text-stone-400 dark:text-stone-500"
      />
      <span class="text-sm font-medium text-stone-800 dark:text-stone-200">
        <slot name="pick-label">
          {{ $t('form.filePickerPick') }}
        </slot>
      </span>
    </label>

    <ul
      v-if="modelValue.length"
      class="space-y-2"
    >
      <li
        v-for="(file, index) in modelValue"
        :key="`${file.name}-${file.size}-${index}`"
        class="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 dark:border-stone-700 dark:bg-stone-900/50"
      >
        <div class="flex min-w-0 items-center gap-2">
          <Icon
            name="ph:file-duotone"
            class="size-5 shrink-0 text-stone-400 dark:text-stone-500"
          />
          <span class="truncate text-sm text-stone-800 dark:text-stone-200">
            {{ file.name }}
          </span>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-200 hover:text-stone-800 disabled:opacity-50 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          :disabled="disabled"
          :aria-label="$t('form.filePickerRemove')"
          @click="removeFile(index)"
        >
          <Icon
            name="ph:x-bold"
            class="size-4"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
