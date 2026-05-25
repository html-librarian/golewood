<script setup lang="ts">
import { HOME_DISCOVERY_TONE_PRESETS } from '#shared/catalog/home-discovery-tones'
import { homePromoHasPhoto } from '#shared/utils/home-promo-display'
import type { HomePromoBanner, HomePromoImageBreakpoint, HomePromoSlot } from '#shared/types/home-promo'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { t, locale } = usePageI18n({ ru, en })
const {
  fetchAdminPromos,
  createPromo,
  updatePromo,
  deletePromo,
  movePromo,
  uploadPromoImage,
  clearPromoImage,
} = useHomePromos()

const { data: banners, refresh, pending } = await useAsyncData('admin-home-promos', () => fetchAdminPromos())

const drafts = ref<Record<string, Partial<HomePromoBanner>>>({})
const savingId = ref<string | null>(null)
const savedId = ref<string | null>(null)
const uploadingKey = ref<string | null>(null)

const newForms = reactive<Record<HomePromoSlot, {
  linkHref: string
  titleRu: string
  titleEn: string
  ctaRu: string
}>>({
  featured: { linkHref: '/', titleRu: '', titleEn: '', ctaRu: '' },
  carousel: { linkHref: '/', titleRu: '', titleEn: '', ctaRu: '' },
})

const toneOptions = computed(() =>
  HOME_DISCOVERY_TONE_PRESETS.map(preset => ({
    value: preset.tone,
    label: locale.value === 'en' ? preset.labelEn : preset.labelRu,
  })),
)

const featuredBanners = computed(() => (banners.value ?? []).filter(item => item.slot === 'featured'))
const carouselBanners = computed(() => (banners.value ?? []).filter(item => item.slot === 'carousel'))

const ensureDraft = (banner: HomePromoBanner) => {
  if (!drafts.value[banner.id]) {
    drafts.value[banner.id] = { ...banner }
  }

  return drafts.value[banner.id]!
}

const syncDraftFromServer = (id: string) => {
  const updated = (banners.value ?? []).find(item => item.id === id)

  if (updated) {
    drafts.value[id] = { ...updated }
  }
}

const saveBanner = async (banner: HomePromoBanner) => {
  const draft = ensureDraft(banner)
  const merged = { ...banner, ...draft }
  savingId.value = banner.id
  savedId.value = null

  try {
    await updatePromo(banner.id, {
      titleRu: draft.titleRu ?? null,
      titleEn: draft.titleEn ?? null,
      subtitleRu: draft.subtitleRu ?? null,
      subtitleEn: draft.subtitleEn ?? null,
      ctaRu: draft.ctaRu ?? null,
      ctaEn: draft.ctaEn ?? null,
      linkHref: draft.linkHref,
      linkExternal: draft.linkExternal,
      backgroundMode: homePromoHasPhoto(merged) ? 'image' : draft.backgroundMode,
      tone: draft.tone,
      active: draft.active,
    })
    savedId.value = banner.id
    await refresh()
    syncDraftFromServer(banner.id)
  } finally {
    savingId.value = null
  }
}

const removeBanner = async (id: string) => {
  await deletePromo(id)
  const { [id]: _removed, ...rest } = drafts.value
  drafts.value = rest
  await refresh()
}

const reorder = async (id: string, direction: 'up' | 'down') => {
  banners.value = await movePromo(id, direction)
  await refresh()
}

const addBanner = async (slot: HomePromoSlot) => {
  const form = newForms[slot]
  await createPromo({
    slot,
    linkHref: form.linkHref.trim() || '/',
    titleRu: form.titleRu.trim() || null,
    titleEn: form.titleEn.trim() || null,
    ctaRu: form.ctaRu.trim() || null,
    tone: 'from-brand-600 to-teal-700',
    backgroundMode: 'gradient',
  })
  form.linkHref = '/'
  form.titleRu = ''
  form.titleEn = ''
  form.ctaRu = ''
  await refresh()
}

const onImagePick = async (banner: HomePromoBanner, breakpoint: HomePromoImageBreakpoint, event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  uploadingKey.value = `${banner.id}-${breakpoint}`

  try {
    await uploadPromoImage(banner.id, breakpoint, file)
    await refresh()
    syncDraftFromServer(banner.id)
  } finally {
    uploadingKey.value = null
    input.value = ''
  }
}

const onClearImage = async (banner: HomePromoBanner, breakpoint: HomePromoImageBreakpoint) => {
  uploadingKey.value = `${banner.id}-${breakpoint}`

  try {
    await clearPromoImage(banner.id, breakpoint)
    await refresh()
    syncDraftFromServer(banner.id)
  } finally {
    uploadingKey.value = null
  }
}

const imageUrlFor = (banner: HomePromoBanner, breakpoint: HomePromoImageBreakpoint) => {
  if (breakpoint === 'desktop') return banner.imageDesktopUrl
  if (breakpoint === 'tablet') return banner.imageTabletUrl
  return banner.imageMobileUrl
}

const breakpoints: { id: HomePromoImageBreakpoint, labelKey: 'imageDesktop' | 'imageTablet' | 'imageMobile' }[] = [
  { id: 'desktop', labelKey: 'imageDesktop' },
  { id: 'tablet', labelKey: 'imageTablet' },
  { id: 'mobile', labelKey: 'imageMobile' },
]
</script>

<template>
  <div class="page-container max-w-4xl space-y-8 pb-10">
    <header class="space-y-1">
      <h1 class="font-display text-2xl font-semibold text-stone-900 dark:text-stone-50">
        {{ t('title') }}
      </h1>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </header>

    <div
      v-if="pending"
      class="text-sm text-stone-500"
    >
      …
    </div>

    <template
      v-for="section in ([
        { slot: 'featured' as const, titleKey: 'featured' as const, list: featuredBanners, addKey: 'addFeatured' as const, emptyKey: 'emptyFeatured' as const, hintKey: 'featuredHint' as const },
        { slot: 'carousel' as const, titleKey: 'carousel' as const, list: carouselBanners, addKey: 'addCarousel' as const, emptyKey: 'emptyCarousel' as const, hintKey: null },
      ])"
      :key="section.slot"
    >
      <section class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {{ t(section.titleKey) }}
          </h2>
          <p
            v-if="section.hintKey"
            class="mt-1 text-xs text-stone-500 dark:text-stone-400"
          >
            {{ t(section.hintKey) }}
          </p>
        </div>

        <p
          v-if="!section.list.length"
          class="text-sm text-stone-500 dark:text-stone-400"
        >
          {{ t(section.emptyKey) }}
        </p>

        <article
          v-for="(banner, index) in section.list"
          :key="banner.id"
          class="surface-card space-y-4 p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-medium uppercase tracking-wide text-stone-500">
              #{{ index + 1 }}
            </span>
            <div class="flex flex-wrap gap-2">
              <UiButton
                size="sm"
                variant="ghost"
                :disabled="index === 0"
                @click="reorder(banner.id, 'up')"
              >
                {{ t('moveUp') }}
              </UiButton>
              <UiButton
                size="sm"
                variant="ghost"
                :disabled="index === section.list.length - 1"
                @click="reorder(banner.id, 'down')"
              >
                {{ t('moveDown') }}
              </UiButton>
              <UiButton
                size="sm"
                variant="danger"
                @click="removeBanner(banner.id)"
              >
                {{ t('delete') }}
              </UiButton>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <FormInput
              v-model="ensureDraft(banner).linkHref"
              :label="t('link')"
            />
            <label class="flex items-end gap-2 pb-2 text-sm text-stone-700 dark:text-stone-300">
              <input
                v-model="ensureDraft(banner).linkExternal"
                type="checkbox"
                class="size-4 rounded border-stone-300 dark:border-stone-600"
              >
              {{ t('linkExternal') }}
            </label>
            <FormInput
              v-model="ensureDraft(banner).titleRu"
              :label="t('titleRu')"
            />
            <FormInput
              v-model="ensureDraft(banner).titleEn"
              :label="t('titleEn')"
            />
            <FormInput
              v-model="ensureDraft(banner).subtitleRu"
              :label="t('subtitleRu')"
            />
            <FormInput
              v-model="ensureDraft(banner).subtitleEn"
              :label="t('subtitleEn')"
            />
            <FormInput
              v-model="ensureDraft(banner).ctaRu"
              :label="t('ctaRu')"
            />
            <FormInput
              v-model="ensureDraft(banner).ctaEn"
              :label="t('ctaEn')"
            />
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <label class="text-sm text-stone-700 dark:text-stone-300">
              <span class="mb-1 block font-medium">{{ t('backgroundMode') }}</span>
              <select
                v-model="ensureDraft(banner).backgroundMode"
                class="form-input w-full"
              >
                <option value="image">
                  {{ t('modeImage') }}
                </option>
                <option value="gradient">
                  {{ t('modeGradient') }}
                </option>
              </select>
            </label>
            <FormInput
              v-model="ensureDraft(banner).tone"
              class="sm:col-span-2"
              :label="t('tone')"
              list="promo-tone-presets"
            />
            <label class="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 sm:col-span-3">
              <input
                v-model="ensureDraft(banner).active"
                type="checkbox"
                class="size-4 rounded border-stone-300 dark:border-stone-600"
              >
              {{ t('active') }}
            </label>
          </div>

          <datalist id="promo-tone-presets">
            <option
              v-for="option in toneOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </datalist>

          <div class="space-y-3 border-t border-stone-200 pt-4 dark:border-stone-800">
            <p class="text-sm font-medium text-stone-800 dark:text-stone-200">
              {{ t('images') }}
            </p>
            <div class="grid gap-4 lg:grid-cols-3">
              <div
                v-for="bp in breakpoints"
                :key="bp.id"
                class="space-y-2"
              >
                <p class="text-xs text-stone-500 dark:text-stone-400">
                  {{ t(bp.labelKey) }}
                </p>
                <div
                  class="flex aspect-16/10 items-center justify-center overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700"
                >
                  <img
                    v-if="imageUrlFor(banner, bp.id)"
                    :src="imageUrlFor(banner, bp.id)!"
                    alt=""
                    class="size-full object-cover"
                  >
                  <span
                    v-else
                    class="text-xs text-stone-400"
                  >—</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <label class="inline-flex cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      class="sr-only"
                      @change="onImagePick(banner, bp.id, $event)"
                    >
                    <span class="inline-flex items-center rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
                      {{ uploadingKey === `${banner.id}-${bp.id}` ? '…' : t('upload') }}
                    </span>
                  </label>
                  <UiButton
                    v-if="imageUrlFor(banner, bp.id)"
                    size="sm"
                    variant="ghost"
                    @click="onClearImage(banner, bp.id)"
                  >
                    {{ t('clearImage') }}
                  </UiButton>
                </div>
              </div>
            </div>
          </div>

          <UiButton
            size="sm"
            :loading="savingId === banner.id"
            @click="saveBanner(banner)"
          >
            {{ savedId === banner.id ? t('saved') : t('save') }}
          </UiButton>
        </article>

        <div class="surface-card grid gap-3 p-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <FormInput
              v-model="newForms[section.slot].linkHref"
              :label="t('link')"
            />
          </div>
          <FormInput
            v-model="newForms[section.slot].titleRu"
            :label="t('titleRu')"
          />
          <FormInput
            v-model="newForms[section.slot].titleEn"
            :label="t('titleEn')"
          />
          <div class="sm:col-span-2">
            <FormInput
              v-model="newForms[section.slot].ctaRu"
              :label="t('ctaRu')"
            />
          </div>
          <div class="sm:col-span-2">
            <UiButton @click="addBanner(section.slot)">
              {{ t(section.addKey) }}
            </UiButton>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
