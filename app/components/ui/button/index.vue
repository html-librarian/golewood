<script setup lang="ts">
import type { UiButtonEmits, UiButtonProps } from './types'

const props = withDefaults(defineProps<UiButtonProps>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
})

const emit = defineEmits<UiButtonEmits>()

const variantClasses = computed(() => {
  if (props.variant === 'secondary') {
    return 'bg-stone-100 text-stone-900 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700'
  }

  if (props.variant === 'ghost') {
    return 'bg-transparent text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
  }

  if (props.variant === 'outline') {
    return 'border border-stone-300 bg-white text-stone-900 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800'
  }

  return [
    'bg-brand-700 text-white shadow-sm hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500',
    // Phosphor duotone: secondary layer reads as a light box on solid fills
    '[&_[opacity="0.2"]]:opacity-0',
  ].join(' ')
})

const sizeClasses = computed(() => {
  if (props.size === 'sm') {
    return 'h-9 rounded-xl px-3 text-xs'
  }

  if (props.size === 'lg') {
    return 'rounded-xl px-6 py-3 text-base'
  }

  return 'rounded-xl px-4 py-2.5 text-sm'
})

const onClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
    :class="[variantClasses, sizeClasses]"
    @click="onClick"
  >
    <span
      v-if="loading"
      class="mr-2 size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
    <slot />
  </button>
</template>
