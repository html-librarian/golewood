<script setup lang="ts">
import type { BlogAuthorOption, BlogFiltersEmits, BlogFiltersProps } from './types'

const props = defineProps<BlogFiltersProps>()
const emit = defineEmits<BlogFiltersEmits>()

const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { fetchCities, searchAuthors } = useBlog()

const authorQuery = ref(props.modelValue.authorQ ?? '')
const authorOptions = ref<BlogAuthorOption[]>([])
const authorLoading = ref(false)

const { data: cities } = await useAsyncData('blog-cities', () => fetchCities())

const cityOptions = computed(() => [
  { value: '', label: t('blog.filters.allCities') },
  ...(cities.value ?? []).map(city => ({ value: city, label: city })),
])

let authorDebounce: ReturnType<typeof setTimeout> | undefined

const patch = (partial: Partial<typeof props.modelValue>, submit = false) => {
  emit('update:modelValue', { ...props.modelValue, ...partial, page: 1 })

  if (submit) {
    emit('submit')
  }
}

watch(authorQuery, (value) => {
  clearTimeout(authorDebounce)
  authorDebounce = setTimeout(async () => {
    const trimmed = value.trim()

    if (trimmed.length < 2) {
      authorOptions.value = []
      return
    }

    authorLoading.value = true

    try {
      const authors = await searchAuthors(trimmed)
      authorOptions.value = authors.map(author => ({
        id: author.id,
        label: author.name ?? t('blog.anonymousAuthor'),
      }))
    } finally {
      authorLoading.value = false
    }
  }, 250)
})

const selectAuthor = (option: BlogAuthorOption) => {
  authorQuery.value = option.label
  patch({ authorId: option.id, authorQ: option.label }, true)
}

const clearAuthor = () => {
  authorQuery.value = ''
  authorOptions.value = []
  patch({ authorId: undefined, authorQ: undefined }, true)
}

onMounted(() => {
  if (props.modelValue.authorQ) {
    authorQuery.value = props.modelValue.authorQ
  }
})

const resetFilters = () => {
  authorQuery.value = ''
  authorOptions.value = []
  emit('update:modelValue', { page: 1, pageSize: props.modelValue.pageSize ?? 24 })
  emit('submit')
}
</script>

<template>
  <form
    class="surface-card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4"
    data-testid="blog-filters"
    @submit.prevent="emit('submit')"
  >
    <FormInput
      :model-value="modelValue.q ?? ''"
      :label="t('blog.filters.search')"
      :placeholder="t('blog.filters.searchPlaceholder')"
      @update:model-value="patch({ q: $event || undefined })"
    />

    <div class="space-y-1.5">
      <label class="form-label">{{ t('blog.filters.author') }}</label>
      <div class="relative">
        <input
          v-model="authorQuery"
          type="search"
          class="form-input w-full"
          :placeholder="t('blog.filters.authorPlaceholder')"
          autocomplete="off"
        >
        <button
          v-if="modelValue.authorId"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-700 dark:text-brand-400"
          @click="clearAuthor()"
        >
          {{ t('blog.filters.clearAuthor') }}
        </button>
        <ul
          v-if="authorOptions.length"
          class="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-(--shadow-card) dark:border-stone-700 dark:bg-stone-900"
        >
          <li
            v-for="option in authorOptions"
            :key="option.id"
          >
            <button
              type="button"
              class="flex w-full px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-800"
              @click="selectAuthor(option)"
            >
              {{ option.label }}
            </button>
          </li>
        </ul>
        <p
          v-if="authorLoading"
          class="mt-1 text-xs text-stone-500 dark:text-stone-400"
        >
          {{ t('common.loading') }}
        </p>
      </div>
    </div>

    <FormSelect
      :model-value="modelValue.city ?? ''"
      :label="t('blog.filters.city')"
      :options="cityOptions"
      @update:model-value="patch({ city: $event || undefined }, true)"
    />

    <FormListingSelect
      :model-value="modelValue.listingId ?? ''"
      :label="t('blog.filters.listing')"
      @update:model-value="patch({ listingId: $event || undefined }, true)"
    />

    <label
      v-if="isAuthenticated"
      class="flex items-center gap-2 text-sm text-stone-700 md:col-span-2 xl:col-span-2 dark:text-stone-300"
    >
      <input
        type="checkbox"
        class="size-4 rounded border-stone-300 text-brand-700 focus:ring-brand-500 dark:border-stone-600"
        :checked="Boolean(modelValue.following)"
        @change="patch({ following: ($event.target as HTMLInputElement).checked || undefined }, true)"
      >
      {{ t('blog.filters.followingOnly') }}
    </label>

    <div class="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-2">
      <UiButton type="submit">
        {{ t('blog.filters.apply') }}
      </UiButton>
      <UiButton
        type="button"
        variant="outline"
        @click="resetFilters()"
      >
        {{ t('blog.filters.reset') }}
      </UiButton>
    </div>
  </form>
</template>
