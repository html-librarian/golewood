<script setup lang="ts">
import { HOME_DISCOVERY_TONE_PRESETS } from '#shared/catalog/home-discovery-tones'
import type { HomeDiscoveryAdminGroup, HomeDiscoveryAdminItem } from '#shared/types/home-discovery-admin'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { t, locale } = usePageI18n({ ru, en })
const {
  fetchAdminDiscovery,
  updateDiscoveryItem,
  createDiscoveryItem,
  deleteDiscoveryItem,
  moveDiscoveryItem,
  uploadDiscoveryImage,
  clearDiscoveryImage,
} = useHomeDiscovery()

const { data: groups, refresh, pending } = await useAsyncData('admin-home-discovery', () => fetchAdminDiscovery())

const drafts = ref<Record<string, { icon: string, tone: string }>>({})
const customToneMode = ref<Record<string, boolean>>({})
const savingId = ref<string | null>(null)
const savedId = ref<string | null>(null)
const uploadingId = ref<string | null>(null)
const fileInputs = ref<Record<string, HTMLInputElement | null>>({})

const newItem = reactive<Record<string, {
  itemKey: string
  labelRu: string
  labelEn: string
  linkType: 'city' | 'amenities'
  city: string
  amenities: string
}>>({})

const toneOptions = computed(() =>
  HOME_DISCOVERY_TONE_PRESETS.map(preset => ({
    value: preset.tone,
    label: locale.value === 'en' ? preset.labelEn : preset.labelRu,
  })),
)

const groupTitle = (group: { titleRu: string, titleEn: string }) =>
  locale.value === 'en' ? group.titleEn : group.titleRu

const itemLabel = (item: HomeDiscoveryAdminItem) =>
  locale.value === 'en' ? item.labelEn : item.labelRu

const ensureNewItem = (groupId: string) => {
  if (!newItem[groupId]) {
    newItem[groupId] = {
      itemKey: '',
      labelRu: '',
      labelEn: '',
      linkType: groupId === 'destinations' ? 'city' : 'amenities',
      city: '',
      amenities: '',
    }
  }

  return newItem[groupId]!
}

const ensureDraft = (item: HomeDiscoveryAdminItem) => {
  if (!drafts.value[item.id]) {
    drafts.value[item.id] = { icon: item.icon, tone: item.tone }
  }

  return drafts.value[item.id]!
}

const isCustomTone = (item: HomeDiscoveryAdminItem) => {
  if (customToneMode.value[item.id]) {
    return true
  }

  const draft = ensureDraft(item)
  return !HOME_DISCOVERY_TONE_PRESETS.some(preset => preset.tone === draft.tone)
}

const enableCustomTone = (item: HomeDiscoveryAdminItem) => {
  customToneMode.value[item.id] = true
}

const clearDraft = (id: string) => {
  const { [id]: _removed, ...rest } = drafts.value
  drafts.value = rest
}

const saveItem = async (item: HomeDiscoveryAdminItem) => {
  const draft = ensureDraft(item)
  savingId.value = item.id
  savedId.value = null

  try {
    await updateDiscoveryItem(item.id, {
      icon: draft.icon.trim(),
      tone: draft.tone.trim(),
    })
    savedId.value = item.id
    await refresh()
    clearDraft(item.id)
  } finally {
    savingId.value = null
  }
}

const toggleActive = async (item: HomeDiscoveryAdminItem) => {
  await updateDiscoveryItem(item.id, { active: !item.active })
  await refresh()
}

const openImagePicker = (id: string) => {
  fileInputs.value[id]?.click()
}

const onImageChange = async (item: HomeDiscoveryAdminItem, event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  uploadingId.value = item.id

  try {
    await uploadDiscoveryImage(item.id, file)
    await refresh()
  } finally {
    uploadingId.value = null
    input.value = ''
  }
}

const onRemoveImage = async (item: HomeDiscoveryAdminItem) => {
  uploadingId.value = item.id

  try {
    await clearDiscoveryImage(item.id)
    await refresh()
  } finally {
    uploadingId.value = null
  }
}

const onMove = async (item: HomeDiscoveryAdminItem, direction: 'up' | 'down') => {
  const updated = await moveDiscoveryItem(item.id, direction)
  groups.value = updated
}

const onDelete = async (item: HomeDiscoveryAdminItem) => {
  if (!import.meta.client || !window.confirm(t('deleteConfirm'))) {
    return
  }

  await deleteDiscoveryItem(item.id)
  await refresh()
}

const onAdd = async (groupId: HomeDiscoveryAdminGroup['id']) => {
  const form = ensureNewItem(groupId)
  const params = form.linkType === 'city'
    ? { city: form.city.trim() }
    : { amenities: form.amenities.split(',').map(s => s.trim()).filter(Boolean) }

  if (form.linkType === 'city' && !params.city) {
    return
  }

  if (form.linkType === 'amenities' && !params.amenities?.length) {
    return
  }

  try {
    await createDiscoveryItem({
      groupId,
      itemKey: form.itemKey.trim(),
      labelRu: form.labelRu.trim(),
      labelEn: form.labelEn.trim() || form.labelRu.trim(),
      params,
    })
    form.itemKey = ''
    form.labelRu = ''
    form.labelEn = ''
    form.city = ''
    form.amenities = ''
    await refresh()
  } catch {
    window.alert(t('errorAdd'))
  }
}

watch(groups, (value) => {
  if (!value) {
    return
  }

  for (const group of value) {
    ensureNewItem(group.id)
    for (const item of group.items) {
      ensureDraft(item)
    }
  }
}, { immediate: true })
</script>

<template>
  <div class="page-container max-w-4xl space-y-8">
    <header class="space-y-1">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </header>

    <p
      v-if="pending"
      class="text-sm text-stone-500"
    >
      …
    </p>

    <template v-else>
      <section
        v-for="group in groups ?? []"
        :key="group.id"
        class="space-y-4"
      >
      <h2 class="text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {{ groupTitle(group) }}
      </h2>

      <ul class="space-y-4">
        <li
          v-for="(item, itemIndex) in group.items"
          :key="item.id"
          class="surface-card space-y-4 p-4"
        >
          <div class="grid gap-4 sm:grid-cols-[auto_1fr]">
            <div class="flex flex-col items-center gap-2">
              <span
                class="flex size-24 items-center justify-center overflow-hidden rounded-full shadow-md ring-1 ring-black/10 sm:size-28"
                :class="item.imageUrl
                  ? 'bg-stone-200 dark:bg-stone-800'
                  : `bg-linear-to-br text-white ${ensureDraft(item).tone}`"
              >
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  alt=""
                  class="size-full object-cover"
                >
                <Icon
                  v-else
                  :name="ensureDraft(item).icon"
                  class="size-11 sm:size-12"
                />
              </span>
              <span class="text-center text-xs font-medium text-stone-600 dark:text-stone-400">
                {{ itemLabel(item) }}
              </span>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="sm:col-span-2 space-y-2">
                <p class="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {{ t('image') }}
                </p>
                <p class="text-xs text-stone-500 dark:text-stone-400">
                  {{ t('imageHint') }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <UiButton
                    size="sm"
                    :loading="uploadingId === item.id"
                    @click="openImagePicker(item.id)"
                  >
                    {{ t('uploadImage') }}
                  </UiButton>
                  <UiButton
                    v-if="item.imageUrl"
                    size="sm"
                    variant="outline"
                    :loading="uploadingId === item.id"
                    @click="onRemoveImage(item)"
                  >
                    {{ t('removeImage') }}
                  </UiButton>
                </div>
                <input
                  :ref="(el) => { fileInputs[item.id] = el as HTMLInputElement }"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="sr-only"
                  @change="onImageChange(item, $event)"
                >
              </div>

              <FormInput
                v-model="ensureDraft(item).icon"
                :label="t('icon')"
                placeholder="ph:sun-duotone"
              />

              <FormSelect
                v-if="!isCustomTone(item)"
                :model-value="ensureDraft(item).tone"
                :label="t('tone')"
                :options="toneOptions"
                @update:model-value="ensureDraft(item).tone = String($event)"
              />

              <FormInput
                v-else
                v-model="ensureDraft(item).tone"
                class="sm:col-span-2"
                :label="t('toneCustom')"
                placeholder="from-sky-400 to-cyan-600"
              />

              <button
                v-if="!isCustomTone(item)"
                type="button"
                class="text-left text-xs font-medium text-brand-700 dark:text-brand-400 sm:col-span-2"
                @click="enableCustomTone(item)"
              >
                {{ t('toneCustom') }}
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 border-t border-stone-200 pt-3 dark:border-stone-800">
            <UiButton
              size="sm"
              variant="outline"
              :disabled="itemIndex === 0"
              @click="onMove(item, 'up')"
            >
              {{ t('moveUp') }}
            </UiButton>
            <UiButton
              size="sm"
              variant="outline"
              :disabled="itemIndex === group.items.length - 1"
              @click="onMove(item, 'down')"
            >
              {{ t('moveDown') }}
            </UiButton>
            <UiButton
              size="sm"
              :loading="savingId === item.id"
              @click="saveItem(item)"
            >
              {{ savedId === item.id ? t('saved') : t('save') }}
            </UiButton>
            <UiButton
              size="sm"
              :variant="item.active ? 'secondary' : 'outline'"
              @click="toggleActive(item)"
            >
              {{ item.active ? t('active') : t('inactive') }}
            </UiButton>
            <UiButton
              size="sm"
              variant="outline"
              @click="onDelete(item)"
            >
              {{ t('delete') }}
            </UiButton>
          </div>
        </li>
      </ul>

      <form
        class="surface-card grid gap-3 p-4 sm:grid-cols-2"
        @submit.prevent="onAdd(group.id)"
      >
        <p class="sm:col-span-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
          {{ t('addTitle') }}
        </p>
        <FormInput
          v-model="ensureNewItem(group.id).itemKey"
          :label="t('addKey')"
          placeholder="sochi"
        />
        <FormSelect
          v-model="ensureNewItem(group.id).linkType"
          :label="t('addLinkType')"
          :options="[
            { value: 'city', label: t('linkCity') },
            { value: 'amenities', label: t('linkAmenities') },
          ]"
        />
        <FormInput
          v-model="ensureNewItem(group.id).labelRu"
          :label="t('addLabelRu')"
        />
        <FormInput
          v-model="ensureNewItem(group.id).labelEn"
          :label="t('addLabelEn')"
        />
        <FormInput
          v-if="ensureNewItem(group.id).linkType === 'city'"
          v-model="ensureNewItem(group.id).city"
          class="sm:col-span-2"
          :label="t('addCity')"
          placeholder="Сочи"
        />
        <FormInput
          v-else
          v-model="ensureNewItem(group.id).amenities"
          class="sm:col-span-2"
          :label="t('addAmenities')"
          placeholder="pool, wifi"
        />
        <UiButton
          type="submit"
          class="sm:col-span-2"
        >
          {{ t('add') }}
        </UiButton>
      </form>
      </section>
    </template>
  </div>
</template>
