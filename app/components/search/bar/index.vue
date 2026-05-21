<script setup lang="ts">
import type { SearchBarEmits, SearchBarProps } from './types'

const props = withDefaults(defineProps<SearchBarProps>(), {
  variant: 'default',
})

const emit = defineEmits<SearchBarEmits>()

const isToolbar = computed(() => props.variant === 'toolbar')

const formClass = computed(() => {
  if (props.variant === 'hero') {
    return 'grid gap-4 rounded-2xl bg-white/95 p-4 shadow-(--shadow-float) backdrop-blur-md md:grid-cols-[1.2fr_1.2fr_0.7fr_auto] md:gap-3 md:p-4 dark:bg-stone-900/95'
  }

  if (isToolbar.value) {
    return 'flex flex-col overflow-visible rounded-xl border border-stone-200 bg-white shadow-sm md:flex-row md:items-stretch dark:border-stone-700 dark:bg-stone-900'
  }

  return 'grid gap-3 rounded-xl border border-stone-200 bg-white p-4 md:grid-cols-[1.2fr_1.2fr_0.7fr_auto] md:gap-3 md:p-3 dark:border-stone-700 dark:bg-stone-900'
})

const fieldsClass = computed(() =>
  isToolbar.value
    ? 'grid min-w-0 flex-1 divide-y divide-stone-200 md:grid-cols-[1.2fr_1.2fr_0.7fr] md:items-stretch md:divide-x md:divide-y-0 dark:divide-stone-700'
    : 'contents',
)
</script>

<template>
  <div>
    <form
      :class="formClass"
      @submit.prevent="emit('submit')"
    >
      <div :class="fieldsClass">
        <FormCitySelect
          :model-value="city"
          :label="$t('search.city')"
          :placeholder="$t('search.cityPlaceholder')"
          :variant="isToolbar ? 'plain' : 'default'"
          @update:model-value="emit('update:city', $event)"
        />
        <FormDateRange
          :start="checkIn"
          :end="checkOut"
          :label="isToolbar ? $t('search.dates') : $t('search.checkIn')"
          :variant="isToolbar ? 'plain' : 'default'"
          @update:start="emit('update:checkIn', $event)"
          @update:end="emit('update:checkOut', $event)"
        />
        <FormNumberStepper
          :model-value="guests"
          :label="$t('search.guests')"
          :min="1"
          :max="16"
          :variant="isToolbar ? 'plain' : 'default'"
          @update:model-value="emit('update:guests', $event)"
        />
      </div>

      <div
        class="flex shrink-0"
        :class="isToolbar
          ? 'border-t border-stone-200 md:border-t-0 md:border-l dark:border-stone-700'
          : 'items-end md:px-1'"
      >
        <UiButton
          type="submit"
          class="w-full"
          :class="isToolbar
            ? 'min-h-12 rounded-none rounded-b-xl md:h-full md:min-h-0 md:min-w-[132px] md:rounded-none md:rounded-r-xl md:py-0'
            : 'md:min-w-[120px]'"
          size="lg"
          :loading="loading"
        >
          <Icon
            name="ph:magnifying-glass-duotone"
            class="mr-2 size-5"
          />
          {{ $t('search.submit') }}
        </UiButton>
      </div>
    </form>

    <p
      v-if="cityHint"
      class="mt-2 flex items-start gap-1.5 text-xs leading-relaxed"
      :class="variant === 'hero' ? 'text-brand-200' : 'text-brand-800 dark:text-brand-300'"
    >
      <Icon
        name="ph:crosshair-duotone"
        class="mt-0.5 size-3.5 shrink-0"
      />
      <span>{{ cityHint }}</span>
    </p>
  </div>
</template>
