<script setup lang="ts">
import type { FormLocaleTab, FormLocaleTabsEmits, FormLocaleTabsProps } from './types'

const props = withDefaults(defineProps<FormLocaleTabsProps>(), {
  modelValue: 'ru',
  ruRequired: false,
})

const emit = defineEmits<FormLocaleTabsEmits>()
const { t } = useI18n()

const active = computed({
  get: () => props.modelValue,
  set: (value: FormLocaleTab) => emit('update:modelValue', value),
})

const tabs = computed(() => [
  { id: 'ru' as const, label: t('form.localeTabs.ru') },
  { id: 'en' as const, label: t('form.localeTabs.en') },
])

const tabButtonClass = (id: FormLocaleTab) => [
  'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
  active.value === id
    ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-50'
    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100',
]
</script>

<template>
  <div class="space-y-4">
    <div
      role="tablist"
      :aria-label="t('form.localeTabs.aria')"
      class="flex gap-1 rounded-xl border border-stone-200 bg-stone-100/80 p-1 dark:border-stone-700 dark:bg-stone-900/80"
    >
      <button
        v-for="tab in tabs"
        :id="`locale-tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="active === tab.id"
        :aria-controls="`locale-panel-${tab.id}`"
        :class="tabButtonClass(tab.id)"
        @click="active = tab.id"
      >
        {{ tab.label }}
        <span
          v-if="tab.id === 'ru' && ruRequired"
          class="ml-0.5 text-red-600 dark:text-red-400"
          aria-hidden="true"
        >*</span>
      </button>
    </div>

    <div
      v-show="active === 'ru'"
      id="locale-panel-ru"
      role="tabpanel"
      aria-labelledby="locale-tab-ru"
      class="space-y-3"
    >
      <slot name="ru" />
    </div>

    <div
      v-show="active === 'en'"
      id="locale-panel-en"
      role="tabpanel"
      aria-labelledby="locale-tab-en"
      class="space-y-3"
    >
      <slot name="en" />
    </div>
  </div>
</template>
