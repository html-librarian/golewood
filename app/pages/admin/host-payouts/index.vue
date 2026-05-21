<script setup lang="ts">
import type { AdminHostPayoutQueueItem } from '#shared/types/host-payout'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const { fetchPendingHostPayouts, decideHostPayout } = useAdmin()

const { data: queue, refresh, pending } = await useAsyncData(
  'admin-host-payouts',
  () => fetchPendingHostPayouts(),
)

const recipientDrafts = ref<Record<string, string>>({})
const savingId = ref<string | null>(null)
const actionError = ref('')

watch(queue, (items) => {
  if (!items) {
    return
  }

  recipientDrafts.value = Object.fromEntries(
    items.map(item => [item.userId, item.yookassaRecipientId ?? '']),
  )
}, { immediate: true })

const handleActivate = async (item: AdminHostPayoutQueueItem) => {
  const recipientId = recipientDrafts.value[item.userId]?.trim()

  if (!recipientId) {
    actionError.value = t('recipientRequired')
    return
  }

  savingId.value = item.userId
  actionError.value = ''

  try {
    await decideHostPayout(item.userId, {
      status: 'active',
      yookassaRecipientId: recipientId,
    })
    await refresh()
  } catch {
    actionError.value = t('actionFailed')
  } finally {
    savingId.value = null
  }
}

const handleReject = async (item: AdminHostPayoutQueueItem) => {
  savingId.value = item.userId
  actionError.value = ''

  try {
    await decideHostPayout(item.userId, {
      status: 'rejected',
      rejectionReason: t('defaultRejectReason'),
    })
    await refresh()
  } catch {
    actionError.value = t('actionFailed')
  } finally {
    savingId.value = null
  }
}
</script>

<template>
  <div class="page-container max-w-3xl">
    <header class="mb-6 space-y-1">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </header>

    <div
      v-if="pending"
      class="space-y-3"
    >
      <div
        v-for="n in 2"
        :key="n"
        class="surface-card space-y-3 p-4"
      >
        <UiSkeleton variant="title" class="w-1/2" />
        <UiSkeleton class="w-full" />
      </div>
    </div>

    <UiEmpty
      v-else-if="!queue?.length"
      icon="ph:wallet-duotone"
      :title="t('empty')"
    />

    <div
      v-else
      class="space-y-4"
    >
      <article
        v-for="item in queue"
        :key="item.userId"
        class="surface-card space-y-4 p-4"
      >
        <div>
          <p class="font-medium text-stone-900 dark:text-stone-100">
            {{ item.userName ?? $t('common.emDash') }}
          </p>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{ t('phone') }}: {{ item.userPhone ?? $t('common.emDash') }}
          </p>
          <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {{ t('userId') }}: {{ item.userId }}
          </p>
        </div>

        <dl class="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-stone-500 dark:text-stone-400">
              {{ t('inn') }}
            </dt>
            <dd class="font-mono text-stone-900 dark:text-stone-100">
              {{ item.inn }}
            </dd>
          </div>
          <div>
            <dt class="text-stone-500 dark:text-stone-400">
              {{ t('bik') }}
            </dt>
            <dd class="font-mono text-stone-900 dark:text-stone-100">
              {{ item.bik }}
            </dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-stone-500 dark:text-stone-400">
              {{ t('bankAccount') }}
            </dt>
            <dd class="font-mono text-stone-900 dark:text-stone-100">
              {{ item.bankAccount }}
            </dd>
          </div>
        </dl>

        <FormInput
          v-model="recipientDrafts[item.userId]"
          :label="t('recipientId')"
          autocomplete="off"
        />

        <div class="flex flex-wrap gap-2">
          <UiButton
            :loading="savingId === item.userId"
            @click="handleActivate(item)"
          >
            {{ t('activate') }}
          </UiButton>
          <UiButton
            variant="secondary"
            :loading="savingId === item.userId"
            @click="handleReject(item)"
          >
            {{ t('reject') }}
          </UiButton>
        </div>
      </article>

      <p
        v-if="actionError"
        class="text-sm text-red-600 dark:text-red-400"
      >
        {{ actionError }}
      </p>
    </div>
  </div>
</template>
