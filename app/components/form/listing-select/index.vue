<script setup lang="ts">
import type { SearchResultItem } from '#shared/types/search'
import type { FormListingSelectEmits, FormListingSelectItem, FormListingSelectProps } from './types'

const props = withDefaults(defineProps<FormListingSelectProps>(), {
  disabled: false,
  required: false,
})

const emit = defineEmits<FormListingSelectEmits>()

const { t } = useI18n()
const { search } = useSearch()
const { fetchPublishedById } = useListings()

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
const items = ref<SearchResultItem[]>([])
const selectedItem = ref<FormListingSelectItem | null>(null)
const loading = ref(false)

const actionButtonClass = 'flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200'

const mapSearchItem = (item: SearchResultItem): FormListingSelectItem => ({
  id: item.id,
  title: item.title,
  city: item.city,
  address: item.address,
  coverPhoto: item.coverPhoto,
})

const formatAddress = (item: Pick<FormListingSelectItem, 'city' | 'address'>) =>
  [item.city, item.address].filter(Boolean).join(' · ')

const loadSelected = async (id: string) => {
  if (!id) {
    selectedItem.value = null
    return
  }

  const fromList = items.value.find(item => item.id === id)

  if (fromList) {
    selectedItem.value = mapSearchItem(fromList)
    return
  }

  if (selectedItem.value?.id === id) {
    return
  }

  try {
    const listing = await fetchPublishedById(id)
    selectedItem.value = {
      id: listing.id,
      title: listing.title,
      city: listing.city,
      address: listing.address,
      coverPhoto: listing.coverPhoto,
    }
  } catch {
    selectedItem.value = null
  }
}

const searchListings = async (value: string) => {
  loading.value = true

  try {
    const result = await search({
      q: value.trim() || undefined,
      pageSize: 20,
    })
    items.value = result.items
  } finally {
    loading.value = false
  }
}

const selectItem = (item: SearchResultItem) => {
  selectedItem.value = mapSearchItem(item)
  emit('update:modelValue', item.id)
  open.value = false
}

const clearSelection = () => {
  selectedItem.value = null
  emit('update:modelValue', '')
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
  if (props.disabled) {
    return
  }

  open.value = !open.value
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    void searchListings('')

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

  if (!import.meta.client) {
    return
  }

  window.removeEventListener('scroll', updatePanelPosition, true)
  window.removeEventListener('resize', updatePanelPosition)
  document.removeEventListener('click', onDocumentClick, true)
})

watch(query, (value) => {
  if (!open.value) {
    return
  }

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    void searchListings(value)
  }, 300)
})

watch(() => props.modelValue, (id) => {
  void loadSelected(id)
}, { immediate: true })

watch(items, () => {
  if (props.modelValue) {
    void loadSelected(props.modelValue)
  }
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)

  if (!import.meta.client) {
    return
  }

  window.removeEventListener('scroll', updatePanelPosition, true)
  window.removeEventListener('resize', updatePanelPosition)
  document.removeEventListener('click', onDocumentClick, true)
})
</script>

<template>
  <FormField
    :id="id"
    :label="label"
    :error="error"
    :required="required"
  >
    <template #default="{ fieldId, labelId }">
      <div
        ref="root"
        class="relative w-full"
        data-testid="form-listing-select"
      >
        <div
          v-if="disabled && selectedItem"
          class="flex items-center gap-3 rounded-xl border border-brand-200/80 bg-brand-50/50 px-3 py-2.5 dark:border-brand-800/60 dark:bg-brand-950/40"
          data-testid="form-listing-select-selected"
        >
          <div class="size-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
            <img
              v-if="selectedItem.coverPhoto?.url"
              :src="selectedItem.coverPhoto.url"
              :alt="selectedItem.title"
              class="size-full object-cover"
            >
            <ListingImagePlaceholder
              v-else
              class="size-full"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-stone-900 dark:text-stone-50">
              {{ selectedItem.title }}
            </p>
            <p class="truncate text-sm text-stone-600 dark:text-stone-400">
              {{ formatAddress(selectedItem) }}
            </p>
          </div>
        </div>

        <div
          v-else
          :id="fieldId"
          ref="triggerRef"
          class="form-input flex w-full items-center gap-0.5 py-0 pl-0 pr-1"
          :class="error ? 'form-input-error' : ''"
          role="combobox"
          :aria-expanded="open"
          :aria-controls="`${fieldId}-listbox`"
          :aria-labelledby="label ? labelId : undefined"
          :aria-label="label ? undefined : t('form.listingSelectPlaceholder')"
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left disabled:cursor-not-allowed"
            :disabled="disabled"
            @click="toggleOpen()"
          >
            <template v-if="selectedItem">
              <div class="size-10 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
                <img
                  v-if="selectedItem.coverPhoto?.url"
                  :src="selectedItem.coverPhoto.url"
                  :alt="selectedItem.title"
                  class="size-full object-cover"
                >
                <ListingImagePlaceholder
                  v-else
                  class="size-full"
                />
              </div>
              <span class="min-w-0 flex-1">
                <span class="block truncate font-medium text-stone-900 dark:text-stone-50">
                  {{ selectedItem.title }}
                </span>
                <span class="block truncate text-sm text-stone-600 dark:text-stone-400">
                  {{ formatAddress(selectedItem) }}
                </span>
              </span>
            </template>
            <span
              v-else
              class="truncate text-stone-500 dark:text-stone-400"
            >
              {{ t('form.listingSelectPlaceholder') }}
            </span>
          </button>

          <button
            v-if="modelValue && !disabled"
            type="button"
            :class="actionButtonClass"
            :aria-label="t('form.listingSelectClear')"
            @click.stop="clearSelection()"
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
            :aria-label="open ? t('form.listingSelectClose') : t('form.listingSelectOpen')"
            @click="toggleOpen()"
          >
            <Icon
              name="ph:caret-down"
              class="size-4 transition"
              :class="{ 'rotate-180': open }"
            />
          </button>
        </div>

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
                :placeholder="t('form.listingSelectSearch')"
                autocomplete="off"
                @click.stop
                @keydown.escape.prevent="open = false"
              >
            </div>

            <ul
              :id="`${fieldId}-listbox`"
              role="listbox"
              class="max-h-60 overflow-auto py-1"
              :aria-label="label"
            >
              <li
                v-if="loading"
                class="px-3 py-3 text-sm text-stone-500 dark:text-stone-400"
              >
                {{ t('common.loading') }}
              </li>

              <li
                v-for="item in items"
                :key="item.id"
                role="option"
                :aria-selected="modelValue === item.id"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-stone-50 dark:hover:bg-stone-800/80"
                  :class="modelValue === item.id
                    ? 'bg-brand-50 dark:bg-brand-950/50'
                    : ''"
                  @click="selectItem(item)"
                >
                  <div class="size-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
                    <img
                      v-if="item.coverPhoto?.url"
                      :src="item.coverPhoto.url"
                      :alt="item.title"
                      class="size-full object-cover"
                    >
                    <ListingImagePlaceholder
                      v-else
                      class="size-full"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-medium text-stone-900 dark:text-stone-50">
                      {{ item.title }}
                    </p>
                    <p class="truncate text-sm text-stone-600 dark:text-stone-400">
                      {{ formatAddress(item) }}
                    </p>
                  </div>
                  <Icon
                    v-if="modelValue === item.id"
                    name="ph:check-circle-fill"
                    class="size-5 shrink-0 text-brand-600 dark:text-brand-400"
                    aria-hidden="true"
                  />
                </button>
              </li>

              <li
                v-if="!loading && !items.length"
                class="px-3 py-3 text-sm text-stone-500 dark:text-stone-400"
              >
                {{ t('form.listingSelectEmpty') }}
              </li>
            </ul>
          </div>
        </Teleport>
      </div>
    </template>
  </FormField>
</template>
