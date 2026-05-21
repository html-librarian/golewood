<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { t } = usePageI18n({ ru, en })
const { fetchAdminAmenities, createAmenity, updateAmenity } = useCatalog()

const { data: amenities, refresh, pending } = await useAsyncData('admin-amenities', () => fetchAdminAmenities())

const form = reactive({
  slug: '',
  icon: 'ph:star-duotone',
  labelRu: '',
  labelEn: '',
})

const saving = ref(false)
const contentLocale = ref<'ru' | 'en'>('ru')

const addAmenity = async () => {
  if (!form.slug.trim() || !form.labelRu.trim()) {
    return
  }

  saving.value = true

  try {
    await createAmenity({
      slug: form.slug.trim(),
      icon: form.icon.trim(),
      labelRu: form.labelRu.trim(),
      labelEn: form.labelEn.trim() || form.labelRu.trim(),
      category: 'comfort',
      active: true,
      sortOrder: (amenities.value?.length ?? 0) + 1,
    })
    form.slug = ''
    form.labelRu = ''
    form.labelEn = ''
    await refresh()
  } finally {
    saving.value = false
  }
}

const toggleActive = async (id: string, active: boolean) => {
  await updateAmenity(id, { active: !active })
  await refresh()
}
</script>

<template>
  <div class="page-container max-w-3xl space-y-6">
    <h1 class="section-title">
      {{ t('title') }}
    </h1>

    <form
      class="surface-card grid gap-3 p-4 sm:grid-cols-2"
      @submit.prevent="addAmenity()"
    >
      <FormInput
        v-model="form.slug"
        :label="t('slug')"
        placeholder="wifi"
      />
      <FormInput
        v-model="form.icon"
        :label="t('icon')"
        placeholder="ph:wifi-high-duotone"
      />
      <FormLocaleTabs
        v-model="contentLocale"
        class="sm:col-span-2"
        ru-required
      >
        <template #ru>
          <FormInput
            v-model="form.labelRu"
            :label="t('formLabel')"
            required
          />
        </template>
        <template #en>
          <FormInput
            v-model="form.labelEn"
            :label="t('formLabel')"
          />
        </template>
      </FormLocaleTabs>
      <UiButton
        type="submit"
        class="sm:col-span-2"
        :loading="saving"
      >
        {{ t('add') }}
      </UiButton>
    </form>

    <ul
      v-if="!pending"
      class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
    >
      <li
        v-for="item in amenities ?? []"
        :key="item.id"
        class="flex items-center justify-between gap-3 px-4 py-3"
      >
        <div class="flex items-center gap-3">
          <Icon
            :name="item.icon"
            class="size-6 text-brand-700 dark:text-brand-300"
          />
          <div>
            <p class="font-medium text-stone-900 dark:text-stone-50">
              {{ item.labelRu }}
            </p>
            <p class="text-xs text-stone-500 dark:text-stone-400">
              {{ item.slug }}
            </p>
          </div>
        </div>
        <UiButton
          size="sm"
          :variant="item.active ? 'secondary' : 'outline'"
          @click="toggleActive(item.id, item.active)"
        >
          {{ item.active ? t('active') : t('inactive') }}
        </UiButton>
      </li>
    </ul>
  </div>
</template>
