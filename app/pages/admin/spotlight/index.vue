<script setup lang="ts">
import { getCurrentMonthKey, formatMonthLabel } from '#shared/utils/spotlight-month'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'], pageTransition: false })

const { t, locale } = usePageI18n({ ru, en })
const { fetchAdminPending, updatePhotoStatus, closeMonth } = useSpotlight()

const monthKey = getCurrentMonthKey()
const monthLabel = formatMonthLabel(monthKey, locale.value)

const { data: pending, refresh, pending: loading } = await useAsyncData(
  'admin-spotlight-pending',
  () => fetchAdminPending(),
)

const actionLoadingId = ref<string | null>(null)
const closeLoading = ref(false)
const message = ref('')

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
  } catch {
    message.value = t('closeFailed')
  } finally {
    closeLoading.value = false
  }
}
</script>

<template>
  <div class="page-container max-w-4xl space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
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
            {{ photo.listingTitle }} · {{ photo.listingCity }}
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
