<script setup lang="ts">
import { HOME_DISCOVERY_TONE_PRESETS } from '#shared/catalog/home-discovery-tones'
import type { HomeDiscoveryAdminItem } from '#shared/types/home-discovery-admin'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { t, locale } = usePageI18n({ ru, en })
const { fetchAdminDiscovery, updateDiscoveryItem } = useHomeDiscovery()

const { data: groups, refresh, pending } = await useAsyncData('admin-home-discovery', () => fetchAdminDiscovery())

const drafts = ref<Record<string, { icon: string, tone: string }>>({})
const customToneMode = ref<Record<string, boolean>>({})
const savingId = ref<string | null>(null)
const savedId = ref<string | null>(null)

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
    const { [item.id]: _removed, ...rest } = drafts.value
    drafts.value = rest
  } finally {
    savingId.value = null
  }
}

const toggleActive = async (item: HomeDiscoveryAdminItem) => {
  await updateDiscoveryItem(item.id, { active: !item.active })
  await refresh()
}

watch(groups, (value) => {
  if (!value) {
    return
  }

  for (const group of value) {
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

    <section
      v-for="group in groups ?? []"
      v-else
      :key="group.id"
      class="space-y-4"
    >
      <h2 class="text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {{ groupTitle(group) }}
      </h2>

      <ul class="space-y-4">
        <li
          v-for="item in group.items"
          :key="item.id"
          class="surface-card grid gap-4 p-4 sm:grid-cols-[auto_1fr_auto]"
        >
          <div class="flex flex-col items-center gap-2">
            <span
              class="flex size-16 items-center justify-center rounded-full bg-linear-to-br text-white shadow-sm ring-1 ring-black/5"
              :class="ensureDraft(item).tone"
            >
              <Icon
                :name="ensureDraft(item).icon"
                class="size-8"
              />
            </span>
            <span class="text-center text-xs font-medium text-stone-600 dark:text-stone-400">
              {{ itemLabel(item) }}
            </span>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
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

          <div class="flex flex-col gap-2 sm:items-end sm:justify-center">
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
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
