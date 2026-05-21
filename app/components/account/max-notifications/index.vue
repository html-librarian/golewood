<script setup lang="ts">
import type { MaxLinkStart, MaxLinkStatus } from '#shared/types/max'
import type { AccountMaxNotificationsEmits, AccountMaxNotificationsProps } from './types'

const props = defineProps<AccountMaxNotificationsProps>()
const emit = defineEmits<AccountMaxNotificationsEmits>()

const { fetchStatus, startLink, unlink, mockLink } = useMaxNotifications()

const status = ref<MaxLinkStatus | null>(null)
const link = ref<MaxLinkStart | null>(null)
const loading = ref(false)
const error = ref('')
const showDevMock = import.meta.dev

const load = async () => {
  loading.value = true
  error.value = ''

  try {
    status.value = await fetchStatus()
    emit('updated', status.value)
  } catch {
    error.value = props.labels.loadError
  } finally {
    loading.value = false
  }
}

const handleStartLink = async () => {
  loading.value = true
  error.value = ''

  try {
    link.value = await startLink()
  } catch {
    error.value = props.labels.linkError
  } finally {
    loading.value = false
  }
}

const handleUnlink = async () => {
  loading.value = true
  error.value = ''

  try {
    await unlink()
    link.value = null
    await load()
  } catch {
    error.value = props.labels.unlinkError
  } finally {
    loading.value = false
  }
}

const handleMockLink = async () => {
  if (!import.meta.dev) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    await mockLink()
    link.value = null
    await load()
  } catch {
    error.value = props.labels.linkError
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
})
</script>

<template>
  <section class="surface-card space-y-4 p-5">
    <div class="flex items-start gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        <Icon
          name="ph:chat-teardrop-dots-duotone"
          class="size-6"
        />
      </span>
      <div class="min-w-0 space-y-1">
        <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ labels.title }}
        </h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{ labels.subtitle }}
        </p>
      </div>
    </div>

    <p
      v-if="!status?.enabled"
      class="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300"
    >
      {{ labels.disabledHint }}
    </p>

    <p
      v-if="error"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ error }}
    </p>

    <div
      v-if="status?.linked"
      class="space-y-3"
    >
      <p class="text-sm text-brand-800 dark:text-brand-200">
        {{ labels.linked }}
      </p>
      <UiButton
        variant="secondary"
        size="sm"
        :loading="loading"
        @click="handleUnlink"
      >
        {{ labels.unlink }}
      </UiButton>
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <UiButton
        size="sm"
        :loading="loading"
        :disabled="!status?.enabled"
        @click="handleStartLink"
      >
        {{ labels.connect }}
      </UiButton>

      <div
        v-if="link"
        class="rounded-xl border border-brand-200 bg-brand-50/80 p-4 dark:border-brand-800 dark:bg-brand-950/50"
      >
        <p class="text-sm text-stone-700 dark:text-stone-300">
          {{ link.instructions }}
        </p>
        <p class="mt-3 font-mono text-2xl font-bold tracking-wider text-brand-800 dark:text-brand-200">
          {{ link.code }}
        </p>
        <p class="mt-2 text-xs text-stone-500 dark:text-stone-400">
          {{ labels.codeExpires }}
        </p>
        <a
          v-if="link.botUrl"
          :href="link.botUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
        >
          {{ labels.openBot }} →
        </a>
      </div>

      <UiButton
        v-if="showDevMock"
        variant="ghost"
        size="sm"
        :loading="loading"
        @click="handleMockLink"
      >
        {{ labels.mockLink }}
      </UiButton>
    </div>
  </section>
</template>
