<script setup lang="ts">
import { getCurrentMonthKey, formatMonthLabel } from '#shared/utils/spotlight-month'
import type { HomeHeroMode } from '#shared/types/home-hero'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'], pageTransition: false })

const { t, locale } = usePageI18n({ ru, en })
const { fetchAdminPending, updatePhotoStatus, closeMonth } = useSpotlight()
const { fetchAdminSettings, updateSettings, uploadBanner, clearBanner, modeOptions } = useHomeHero()

const monthKey = getCurrentMonthKey()
const monthLabel = formatMonthLabel(monthKey, locale.value)

const { data: pending, refresh, pending: loading } = await useAsyncData(
  'admin-spotlight-pending',
  () => fetchAdminPending(),
)

const { data: bannerSettings, refresh: refreshBanner } = await useAsyncData(
  'admin-home-hero',
  () => fetchAdminSettings(),
)

const actionLoadingId = ref<string | null>(null)
const closeLoading = ref(false)
const message = ref('')
const bannerMode = ref<HomeHeroMode>('auto')
const creditRu = ref('')
const creditEn = ref('')
const bannerSaving = ref(false)
const bannerUploading = ref(false)
const bannerMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

watch(bannerSettings, (value) => {
  if (!value) {
    return
  }

  bannerMode.value = value.mode
  creditRu.value = value.creditRu ?? ''
  creditEn.value = value.creditEn ?? ''
}, { immediate: true })

const modeSelectOptions = computed(() =>
  modeOptions.map(option => ({
    value: option.value,
    label: t(option.labelKey),
  })),
)

const previewCredit = computed(() => {
  const resolved = bannerSettings.value?.resolved

  if (!resolved?.imageUrl) {
    return null
  }

  if (resolved.source === 'contest' && resolved.listingTitle) {
    return `${t('modeContest')}: ${resolved.listingTitle}`
  }

  return locale.value === 'en'
    ? resolved.creditEn ?? resolved.creditRu
    : resolved.creditRu ?? resolved.creditEn
})

const moderate = async (id: string, status: 'approved' | 'rejected') => {
  actionLoadingId.value = id

  try {
    await updatePhotoStatus(id, status)
    await refresh()
  } finally {
    actionLoadingId.value = null
  }
}

const onCloseMonth = async () => {
  closeLoading.value = true
  message.value = ''

  try {
    await closeMonth(monthKey)
    message.value = t('closeSuccess')
    await refreshBanner()
  } catch {
    message.value = t('closeFailed')
  } finally {
    closeLoading.value = false
  }
}

const saveBannerSettings = async () => {
  bannerSaving.value = true
  bannerMessage.value = ''

  try {
    await updateSettings({
      mode: bannerMode.value,
      creditRu: creditRu.value.trim() || null,
      creditEn: creditEn.value.trim() || null,
    })
    bannerMessage.value = t('bannerSaved')
    await refreshBanner()
  } finally {
    bannerSaving.value = false
  }
}

const onBannerFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  bannerUploading.value = true
  bannerMessage.value = ''

  try {
    await uploadBanner(file)
    bannerMessage.value = t('bannerSaved')
    await refreshBanner()
  } catch {
    bannerMessage.value = t('bannerUploadFailed')
  } finally {
    bannerUploading.value = false
    input.value = ''
  }
}

const onRemoveBanner = async () => {
  bannerUploading.value = true
  bannerMessage.value = ''

  try {
    await clearBanner()
    await refreshBanner()
    bannerMessage.value = t('bannerSaved')
  } finally {
    bannerUploading.value = false
  }
}

const openFilePicker = () => {
  fileInput.value?.click()
}
</script>

<template>
  <div class="page-container max-w-4xl space-y-10">
    <section class="space-y-4">
      <div>
        <h2 class="text-xl font-semibold text-stone-900 dark:text-stone-100">
          {{ t('bannerTitle') }}
        </h2>
        <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {{ t('bannerSubtitle') }}
        </p>
      </div>

      <div class="surface-card grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
        <div class="space-y-4">
          <FormSelect
            v-model="bannerMode"
            :label="t('bannerMode')"
            :options="modeSelectOptions"
          />

          <div class="grid gap-3 sm:grid-cols-2">
            <FormInput
              v-model="creditRu"
              :label="t('bannerCreditRu')"
            />
            <FormInput
              v-model="creditEn"
              :label="t('bannerCreditEn')"
            />
          </div>

          <div class="flex flex-wrap gap-2">
            <UiButton
              type="button"
              :loading="bannerUploading"
              @click="openFilePicker()"
            >
              {{ bannerUploading ? t('bannerUploading') : t('bannerUpload') }}
            </UiButton>
            <UiButton
              v-if="bannerSettings?.imageUrl"
              type="button"
              variant="outline"
              :loading="bannerUploading"
              @click="onRemoveBanner()"
            >
              {{ t('bannerRemove') }}
            </UiButton>
            <UiButton
              type="button"
              variant="secondary"
              :loading="bannerSaving"
              @click="saveBannerSettings()"
            >
              {{ t('bannerSave') }}
            </UiButton>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="sr-only"
            @change="onBannerFileChange"
          >

          <p
            v-if="bannerMessage"
            class="text-sm text-brand-800 dark:text-brand-200"
          >
            {{ bannerMessage }}
          </p>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {{ t('bannerPreview') }}
          </p>
          <div class="relative aspect-4/3 overflow-hidden rounded-xl ring-1 ring-stone-200 dark:ring-stone-700">
            <img
              v-if="bannerSettings?.resolved.imageUrl"
              :src="bannerSettings.resolved.imageUrl"
              alt=""
              class="absolute inset-0 size-full object-cover"
            >
            <div
              class="absolute inset-0"
              :class="bannerSettings?.resolved.imageUrl
                ? 'bg-linear-to-br from-brand-950/85 via-brand-900/70 to-brand-950/90'
                : 'bg-linear-to-br from-brand-900 via-brand-800 to-brand-700'"
            />
            <p
              v-if="previewCredit"
              class="absolute inset-x-0 bottom-0 bg-stone-950/50 px-2 py-1.5 text-center text-[10px] text-white"
            >
              {{ previewCredit }}
            </p>
            <p
              v-else-if="!bannerSettings?.resolved.imageUrl"
              class="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-brand-100"
            >
              {{ t('bannerNoImage') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <div class="flex flex-wrap items-start justify-between gap-4 border-t border-stone-200 pt-8 dark:border-stone-800">
      <div>
        <h1 class="section-title">
          {{ t('title') }}
        </h1>
        <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {{ monthLabel }}
        </p>
      </div>
      <UiButton
        variant="secondary"
        :loading="closeLoading"
        @click="onCloseMonth()"
      >
        {{ t('closeMonth') }}
      </UiButton>
    </div>

    <p class="text-sm text-stone-600 dark:text-stone-400">
      {{ t('closeMonthHint') }}
    </p>

    <p
      v-if="message"
      class="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:bg-brand-950 dark:text-brand-100"
    >
      {{ message }}
    </p>

    <h2 class="text-xl font-semibold text-stone-900 dark:text-stone-100">
      {{ t('pending') }}
    </h2>

    <p
      v-if="loading"
      class="text-sm text-stone-500"
    >
      {{ $t('common.loading') }}
    </p>

    <p
      v-else-if="!pending?.length"
      class="text-stone-600 dark:text-stone-400"
    >
      {{ t('empty') }}
    </p>

    <ul
      v-else
      class="space-y-4"
    >
      <li
        v-for="photo in pending"
        :key="photo.id"
        class="surface-card flex flex-wrap gap-4 p-4"
      >
        <img
          :src="photo.imageUrl"
          :alt="photo.listingTitle"
          class="size-28 rounded-lg object-cover"
        >
        <div class="min-w-0 flex-1 space-y-1">
          <p class="font-semibold text-stone-900 dark:text-stone-50">
            {{ photo.listingTitle ?? photo.placeName ?? '—' }}
            <span v-if="photo.listingCity"> · {{ photo.listingCity }}</span>
          </p>
          <p
            v-if="photo.listingId"
            class="text-xs text-brand-700 dark:text-brand-300"
          >
            <NuxtLink :to="`/listings/${photo.listingId}`">
              /listings/{{ photo.listingId }}
            </NuxtLink>
          </p>
          <p
            v-else-if="photo.externalSiteUrl || photo.externalInstagram"
            class="flex flex-wrap gap-x-3 text-xs text-stone-600 dark:text-stone-400"
          >
            <a
              v-if="photo.externalSiteUrl"
              :href="photo.externalSiteUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-brand-700 hover:underline dark:text-brand-300"
            >
              {{ photo.externalSiteUrl }}
            </a>
            <a
              v-if="photo.externalInstagram"
              :href="photo.externalInstagram"
              target="_blank"
              rel="noopener noreferrer"
              class="text-brand-700 hover:underline dark:text-brand-300"
            >
              Instagram
            </a>
          </p>
          <p
            v-if="photo.caption"
            class="text-sm text-stone-600 dark:text-stone-400"
          >
            {{ photo.caption }}
          </p>
          <p class="text-xs text-stone-500">
            {{ photo.authorName ?? '—' }} · {{ photo.monthKey }}
          </p>
        </div>
        <div class="flex gap-2">
          <UiButton
            size="sm"
            :loading="actionLoadingId === photo.id"
            @click="moderate(photo.id, 'approved')"
          >
            {{ t('approve') }}
          </UiButton>
          <UiButton
            size="sm"
            variant="outline"
            :loading="actionLoadingId === photo.id"
            @click="moderate(photo.id, 'rejected')"
          >
            {{ t('reject') }}
          </UiButton>
        </div>
      </li>
    </ul>
  </div>
</template>
