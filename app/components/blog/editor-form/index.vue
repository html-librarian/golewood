<script setup lang="ts">
import { sanitizeHtml, textLengthFromHtml } from '#shared/utils/sanitize-html'
import ru from './i18n/ru'
import en from './i18n/en'
import type { BlogEditorFormEmits, BlogEditorFormModel, BlogEditorFormProps } from './types'

const props = defineProps<BlogEditorFormProps>()
const emit = defineEmits<BlogEditorFormEmits>()

const { t } = usePageI18n({ ru, en })

const contentLocale = ref<'ru' | 'en'>('ru')

const statusOptions = computed(() => [
  { value: 'draft', label: t('draft') },
  { value: 'published', label: t('published') },
])

const updateField = <K extends keyof BlogEditorFormModel>(key: K, value: BlogEditorFormModel[K]) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const submit = () => {
  if (!props.modelValue.titleRu.trim() || textLengthFromHtml(props.modelValue.bodyRu) < 20) {
    return
  }

  emit('submit', {
    listingId: props.modelValue.listingId || null,
    city: props.modelValue.city.trim() || null,
    titleRu: props.modelValue.titleRu.trim(),
    titleEn: props.modelValue.titleEn.trim() || undefined,
    excerptRu: props.modelValue.excerptRu.trim(),
    excerptEn: props.modelValue.excerptEn.trim() || undefined,
    bodyRu: sanitizeHtml(props.modelValue.bodyRu),
    bodyEn: props.modelValue.bodyEn.trim() ? sanitizeHtml(props.modelValue.bodyEn) : undefined,
    coverImageUrl: props.modelValue.coverImageUrl.trim() || null,
    status: props.modelValue.status,
  })
}
</script>

<template>
  <form
    class="surface-card grid gap-3 p-4 sm:grid-cols-2"
    data-testid="blog-editor-form"
    @submit.prevent="submit()"
  >
    <FormListingSelect
      :model-value="modelValue.listingId"
      :label="t('listingLabel')"
      class="sm:col-span-2"
      @update:model-value="updateField('listingId', $event)"
    />

    <FormInput
      :model-value="modelValue.city"
      :label="t('cityLabel')"
      :placeholder="t('cityPlaceholder')"
      class="sm:col-span-2"
      @update:model-value="updateField('city', $event)"
    />

    <div class="sm:col-span-2 flex gap-2">
      <UiButton
        type="button"
        size="sm"
        :variant="contentLocale === 'ru' ? 'primary' : 'outline'"
        @click="contentLocale = 'ru'"
      >
        RU
      </UiButton>
      <UiButton
        type="button"
        size="sm"
        :variant="contentLocale === 'en' ? 'primary' : 'outline'"
        @click="contentLocale = 'en'"
      >
        EN
      </UiButton>
    </div>

    <template v-if="contentLocale === 'ru'">
      <FormInput
        :model-value="modelValue.titleRu"
        :label="t('titleRu')"
        class="sm:col-span-2"
        required
        @update:model-value="updateField('titleRu', $event)"
      />
      <FormTextarea
        :model-value="modelValue.excerptRu"
        :label="t('excerptRu')"
        class="sm:col-span-2"
        :rows="2"
        @update:model-value="updateField('excerptRu', $event)"
      />
      <FormRichText
        :model-value="modelValue.bodyRu"
        :label="t('bodyRu')"
        class="sm:col-span-2"
        @update:model-value="updateField('bodyRu', $event)"
      />
    </template>

    <template v-else>
      <FormInput
        :model-value="modelValue.titleEn"
        :label="t('titleEn')"
        class="sm:col-span-2"
        @update:model-value="updateField('titleEn', $event)"
      />
      <FormTextarea
        :model-value="modelValue.excerptEn"
        :label="t('excerptEn')"
        class="sm:col-span-2"
        :rows="2"
        @update:model-value="updateField('excerptEn', $event)"
      />
      <FormRichText
        :model-value="modelValue.bodyEn"
        :label="t('bodyEn')"
        class="sm:col-span-2"
        @update:model-value="updateField('bodyEn', $event)"
      />
    </template>

    <FormInput
      :model-value="modelValue.coverImageUrl"
      :label="t('coverLabel')"
      class="sm:col-span-2"
      @update:model-value="updateField('coverImageUrl', $event)"
    />

    <FormSelect
      :model-value="modelValue.status"
      :label="t('statusLabel')"
      :options="statusOptions"
      @update:model-value="updateField('status', $event as BlogEditorFormModel['status'])"
    />

    <div class="flex items-end">
      <UiButton
        type="submit"
        :loading="saving"
      >
        {{ submitLabel }}
      </UiButton>
    </div>
  </form>
</template>
