<script setup lang="ts">
import { REPORT_STATUS_LABELS } from '#shared/types/report'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
  staffRoles: ['admin', 'support'],
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const { locale } = useI18n()
const { fetchSupportRequests, updateSupportRequestStatus } = useAdmin()

const { data: requests, refresh, pending } = await useAsyncData(
  'admin-support-requests',
  () => fetchSupportRequests(),
)

const handleStatus = async (
  id: string,
  status: 'in_progress' | 'resolved' | 'dismissed',
) => {
  await updateSupportRequestStatus(id, status)
  await refresh()
}
</script>

<template>
  <div class="page-container max-w-4xl">
    <h1 class="section-title mb-6">
      {{ t('title') }}
    </h1>

    <div
      v-if="pending"
      class="space-y-4"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="surface-card space-y-3 p-4"
      >
        <UiSkeleton class="w-1/4" />
        <UiSkeleton class="w-full" />
      </div>
    </div>

    <UiEmpty
      v-else-if="!requests?.length"
      icon="ph:headset-duotone"
      :title="t('empty')"
    />

    <div
      v-else
      class="space-y-4"
    >
      <article
        v-for="request in requests"
        :key="request.id"
        class="surface-card p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="space-y-2">
            <div class="flex flex-wrap gap-2">
              <UiBadge variant="brand">
                {{ REPORT_STATUS_LABELS[request.status][locale as 'ru' | 'en'] }}
              </UiBadge>
            </div>
            <p class="font-medium text-stone-900 dark:text-stone-100">
              {{ request.name }}
            </p>
            <p class="text-sm text-stone-600 dark:text-stone-400">
              {{ t('email') }}:
              <a
                :href="`mailto:${request.email}`"
                class="text-brand-700 hover:underline dark:text-brand-300"
              >
                {{ request.email }}
              </a>
            </p>
            <p
              v-if="request.contextUrl"
              class="text-sm text-stone-600 dark:text-stone-400"
            >
              {{ t('contextUrl') }}:
              <a
                :href="request.contextUrl"
                class="break-all text-brand-700 hover:underline dark:text-brand-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ request.contextUrl }}
              </a>
            </p>
            <p class="whitespace-pre-wrap text-stone-700 dark:text-stone-300">
              {{ request.message }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UiButton
              v-if="request.status === 'open'"
              variant="secondary"
              @click="handleStatus(request.id, 'in_progress')"
            >
              {{ t('statusInProgress') }}
            </UiButton>
            <UiButton
              variant="secondary"
              @click="handleStatus(request.id, 'resolved')"
            >
              {{ t('statusResolved') }}
            </UiButton>
            <UiButton
              variant="ghost"
              @click="handleStatus(request.id, 'dismissed')"
            >
              {{ t('statusDismissed') }}
            </UiButton>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
