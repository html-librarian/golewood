<script setup lang="ts">
import type { City } from '#shared/types/catalog'
import type { FormCitySelectEmits, FormCitySelectProps } from './types'

const props = withDefaults(defineProps<FormCitySelectProps>(), {
  disabled: false,
  placeholder: '',
  countryCode: 'RU',
  variant: 'default',
  clearable: true,
})

const emit = defineEmits<FormCitySelectEmits>()

const { locale, t } = useI18n()
const { fetchCities } = useCatalog()
const root = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const open = ref(false)
const panelStyle = ref<{ top: string, left: string, width: string }>({
  top: '0px',
  left: '0px',
  width: '16rem',
})
const query = ref('')
const cities = ref<City[]>([])
const loading = ref(false)

const selectedLabel = computed(() => props.modelValue || props.placeholder)

const triggerClass = computed(() => {
  if (props.variant === 'plain') {
    return 'flex w-full min-h-[2.75rem] items-center gap-1 border-0 bg-transparent px-3 text-stone-900 outline-none focus-within:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-100'
  }

  return [
    'form-input flex w-full items-center gap-0.5 py-0 pl-0 pr-1 text-left',
    props.error ? 'form-input-error' : '',
  ]
})

const actionButtonClass = 'flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200'

const dropdownCities = computed(() => {
  const trimmedQuery = query.value.trim()

  if (trimmedQuery) {
    return cities.value
  }

  if (!props.modelValue) {
    return cities.value
  }

  return cities.value.filter(city => city.name !== props.modelValue)
})

const loadCities = async (q?: string) => {
  loading.value = true

  try {
    cities.value = await fetchCities({ q, country: props.countryCode })
  } finally {
    loading.value = false
  }
}

const selectCity = (name: string) => {
  emit('update:modelValue', name)
  query.value = name
  open.value = false
}

const clearSelection = () => {
  emit('update:modelValue', '')
  query.value = ''
  open.value = false
}

const updatePanelPosition = () => {
  if (!triggerRef.value) {
    return
  }

  const rect = triggerRef.value.getBoundingClientRect()
  const panelWidth = Math.min(rect.width, window.innerWidth - 16)
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - panelWidth - 8))

  panelStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${left}px`,
    width: `${panelWidth}px`,
  }
}

const onDocumentClick = (event: MouseEvent) => {
  const target = event.target as Node

  if (root.value?.contains(target) || panel.value?.contains(target)) {
    return
  }

  open.value = false
}

const focusSearchInput = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      searchInputRef.value?.focus({ preventScroll: true })
    })
  })
}

const toggleOpen = () => {
  open.value = !open.value
}

watch(open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    void loadCities()

    if (!import.meta.client) {
      return
    }

    nextTick(() => {
      updatePanelPosition()
      focusSearchInput()
      document.addEventListener('click', onDocumentClick, true)
    })
    window.addEventListener('scroll', updatePanelPosition, true)
    window.addEventListener('resize', updatePanelPosition)
    return
  }

  if (props.modelValue) {
    query.value = props.modelValue
  }

  if (!import.meta.client) {
    return
  }

  window.removeEventListener('scroll', updatePanelPosition, true)
  window.removeEventListener('resize', updatePanelPosition)
  document.removeEventListener('click', onDocumentClick, true)
})

let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(() => props.countryCode, () => {
  if (open.value) {
    void loadCities(query.value.trim() || undefined)
  }
})

watch(() => props.modelValue, (value) => {
  if (!open.value) {
    query.value = value
  }
}, { immediate: true })

watch(query, (value) => {
  if (!open.value) {
    return
  }

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    void loadCities(value.trim() || undefined)
  }, 200)
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  window.removeEventListener('scroll', updatePanelPosition, true)
  window.removeEventListener('resize', updatePanelPosition)
  document.removeEventListener('click', onDocumentClick, true)
})

onMounted(() => {
  void loadCities()
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
        data-testid="form-city-select"
        class="relative w-full"
        :class="hint ? 'space-y-1.5' : ''"
      >
        <div
          :id="fieldId"
          ref="triggerRef"
          :class="triggerClass"
          :aria-expanded="open"
          role="combobox"
        >
          <button
            type="button"
            class="min-w-0 flex-1 truncate text-left disabled:cursor-not-allowed"
            :class="[
              props.variant === 'plain' ? 'px-0 py-0' : 'border-0 bg-transparent py-2.5 pl-3.5',
              !modelValue ? 'text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-stone-100',
            ]"
            :disabled="disabled"
            @click="toggleOpen()"
          >
            {{ selectedLabel }}
          </button>

          <button
            v-if="clearable && modelValue && !disabled"
            type="button"
            :class="actionButtonClass"
            :aria-label="t('form.cityClear')"
            @click.stop="clearSelection"
          >
            <Icon
              name="ph:x-bold"
              class="size-3.5"
            />
          </button>

          <button
            type="button"
            :class="actionButtonClass"
            :disabled="disabled"
            :aria-label="open ? t('form.cityClose') : t('form.cityOpen')"
            @click="toggleOpen()"
          >
            <Icon
              name="ph:caret-down"
              class="size-4 transition"
              :class="{ 'rotate-180': open }"
            />
          </button>
        </div>

        <p
          v-if="hint"
          class="flex items-start gap-1.5 text-xs leading-relaxed text-brand-800 dark:text-brand-300"
        >
          <Icon
            name="ph:crosshair-duotone"
            class="mt-0.5 size-3.5 shrink-0"
          />
          <span>{{ hint }}</span>
        </p>

        <Teleport to="body">
          <div
            v-if="open"
            ref="panel"
            class="fixed z-200 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-(--shadow-card) dark:border-stone-700 dark:bg-stone-900"
            :style="panelStyle"
          >
            <div class="border-b border-stone-200 p-2 dark:border-stone-700">
              <input
                ref="searchInputRef"
                v-model="query"
                type="search"
                class="form-input w-full py-2 text-sm"
                :placeholder="$t('form.citySearch')"
                autocomplete="off"
                @click.stop
                @keydown.escape.prevent="open = false"
              >
            </div>

            <ul
              role="listbox"
              class="max-h-52 overflow-auto py-1"
            >
              <li
                v-if="loading"
                class="px-3 py-2 text-sm text-stone-500 dark:text-stone-400"
              >
                {{ $t('common.loading') }}
              </li>
              <li
                v-if="modelValue && !loading"
                role="option"
              >
                <button
                  type="button"
                  class="flex w-full px-3 py-2 text-left text-sm text-stone-600 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                  @click="clearSelection"
                >
                  {{ t('form.cityClear') }}
                </button>
              </li>
              <li
                v-for="city in dropdownCities"
                :key="city.id"
                role="option"
                :aria-selected="modelValue === city.name"
              >
                <button
                  type="button"
                  class="flex w-full px-3 py-2 text-left text-sm transition hover:bg-stone-100 dark:hover:bg-stone-800"
                  :class="modelValue === city.name
                    ? 'bg-brand-50 font-medium text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                    : 'text-stone-800 dark:text-stone-200'"
                  @click="selectCity(city.name)"
                >
                  {{ locale === 'en' && city.nameEn ? city.nameEn : city.name }}
                </button>
              </li>
              <li
                v-if="!loading && !dropdownCities.length && !modelValue"
                class="px-3 py-2 text-sm text-stone-500 dark:text-stone-400"
              >
                {{ $t('form.cityEmpty') }}
              </li>
              <li
                v-if="!loading && !dropdownCities.length && modelValue && query.trim()"
                class="px-3 py-2 text-sm text-stone-500 dark:text-stone-400"
              >
                {{ $t('form.cityEmpty') }}
              </li>
            </ul>
          </div>
        </Teleport>
      </div>
    </template>
  </FormField>
</template>
