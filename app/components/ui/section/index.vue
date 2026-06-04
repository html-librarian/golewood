<script setup lang="ts">
import type { UiSectionProps } from './types'

const props = withDefaults(defineProps<UiSectionProps>(), {
  scrollMargin: true,
  variant: 'card',
})

const slots = useSlots()

const rootClass = computed(() => {
  const classes = [props.scrollMargin ? 'scroll-mt-32' : '']

  if (props.variant === 'card') {
    classes.push('surface-card relative overflow-hidden p-5 md:p-6')
  } else {
    classes.push('space-y-4')
  }

  return classes.join(' ')
})

const showHeader = computed(() =>
  Boolean(props.title || props.icon || slots.title || slots.actions),
)
</script>

<template>
  <section
    :id="id"
    :class="rootClass"
  >
    <span
      v-if="variant === 'card'"
      class="card-crown"
      aria-hidden="true"
    />
    <header
      v-if="showHeader"
      class="relative mb-5 flex items-start gap-3 border-b border-stone-100 pb-4 md:mb-6 md:gap-4 dark:border-stone-800"
    >
      <span
        v-if="icon"
        class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-50 to-brand-100/80 text-brand-700 ring-1 ring-brand-200/60 dark:from-brand-950/80 dark:to-brand-900/40 dark:text-brand-300 dark:ring-brand-800/50"
        aria-hidden="true"
      >
        <Icon
          :name="icon"
          class="size-5"
        />
      </span>

      <div class="min-w-0 flex-1">
        <h2
          v-if="title || $slots.title"
          class="section-title-sm section-title-accent"
        >
          <slot name="title">
            {{ title }}
          </slot>
        </h2>
      </div>

      <div
        v-if="$slots.actions"
        class="ml-auto shrink-0"
      >
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>
