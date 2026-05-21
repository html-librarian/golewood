<script setup lang="ts">
import { REPORT_STATUS_LABELS, REPORT_TYPE_LABELS } from '#shared/types/report'
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
const { fetchReports, updateReportStatus } = useAdmin()

const { data: reports, refresh, pending } = await useAsyncData('admin-reports-list', () => fetchReports())

const handleStatus = async (
  id: string,
  status: 'in_progress' | 'resolved' | 'dismissed',
) => {
  await updateReportStatus(id, status)
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
        <UiSkeleton class="w-1/2" />
        <UiSkeleton class="w-full" />
      </div>
    </div>

    <UiEmpty
      v-else-if="!reports?.length"
      icon="ph:flag-duotone"
      :title="t('empty')"
    />

    <div
      v-else
      class="space-y-4"
    >
      <article
        v-for="report in reports"
        :key="report.id"
        class="surface-card p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="space-y-2">
            <div class="flex flex-wrap gap-2">
              <UiBadge variant="muted">
                {{ REPORT_TYPE_LABELS[report.type][locale as 'ru' | 'en'] }}
              </UiBadge>
              <UiBadge variant="brand">
                {{ REPORT_STATUS_LABELS[report.status][locale as 'ru' | 'en'] }}
              </UiBadge>
            </div>
            <p class="text-sm text-stone-600 dark:text-stone-400">
              {{ t('reporter') }}: {{ report.reporterName ?? report.reporterPhone }}
            </p>
            <p class="whitespace-pre-wrap text-stone-700 dark:text-stone-300">
              {{ report.reason }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UiButton
              v-if="report.status === 'open'"
              variant="secondary"
              @click="handleStatus(report.id, 'in_progress')"
            >
              {{ t('inProgress') }}
            </UiButton>
            <UiButton @click="handleStatus(report.id, 'resolved')">
              {{ t('resolve') }}
            </UiButton>
            <UiButton
              variant="secondary"
              @click="handleStatus(report.id, 'dismissed')"
            >
              {{ t('dismiss') }}
            </UiButton>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
