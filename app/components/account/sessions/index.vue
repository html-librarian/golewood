<script setup lang="ts">
import type { UserSession } from '#shared/types/user'
import { SESSION_LIST_PREVIEW_OTHERS } from '#shared/types/session'
import { formatSessionDeviceLabel } from '#shared/utils/session-client'
import type { AccountSessionsLabels } from './types'

const props = defineProps<{ labels: AccountSessionsLabels }>()

const { locale } = useI18n()
const { refreshToken, sessionId, clearSession } = useAuth()
const { fetchSessions, revokeSession, revokeOtherSessions } = useAccountSessions()
const localePath = useLocalePath()

const sessions = ref<UserSession[]>([])
const pending = ref(true)
const error = ref(false)
const revokingId = ref<string | null>(null)
const revokingOthers = ref(false)
const showAllOthers = ref(false)

const deviceLabels = computed(() => ({
  unknown: props.labels.deviceUnknown,
  phone: props.labels.devicePhone,
}))

const load = async () => {
  pending.value = true
  error.value = false

  try {
    const result = await fetchSessions()
    sessions.value = result.sessions
  } catch {
    error.value = true
    sessions.value = []
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  void load()
})

const formatRelative = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)

  if (minutes < 1) {
    return props.labels.justNow
  }

  if (minutes < 60) {
    return props.labels.minutesAgo(minutes)
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return props.labels.hoursAgo(hours)
  }

  const days = Math.floor(hours / 24)

  if (days < 14) {
    return props.labels.daysAgo(days)
  }

  return new Date(iso).toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'short',
  })
}

const deviceName = (session: UserSession) =>
  formatSessionDeviceLabel(session.userAgent, deviceLabels.value)

const currentSession = computed(() => sessions.value.find(session => session.current))
const otherSessions = computed(() => sessions.value.filter(session => !session.current))
const visibleOthers = computed(() => {
  if (showAllOthers.value) {
    return otherSessions.value
  }

  return otherSessions.value.slice(0, SESSION_LIST_PREVIEW_OTHERS)
})
const hiddenOthersCount = computed(() =>
  Math.max(0, otherSessions.value.length - SESSION_LIST_PREVIEW_OTHERS),
)

const handleRevoke = async (session: UserSession) => {
  revokingId.value = session.id

  try {
    await revokeSession(session.id)

    if (session.current || session.id === sessionId.value) {
      clearSession()
      await navigateTo(localePath('/auth/login'))
      return
    }

    await load()
  } finally {
    revokingId.value = null
  }
}

const handleRevokeOthers = async () => {
  if (!refreshToken.value) {
    return
  }

  revokingOthers.value = true

  try {
    await revokeOtherSessions()
    showAllOthers.value = false
    await load()
  } finally {
    revokingOthers.value = false
  }
}
</script>

<template>
  <section
    class="surface-card space-y-4 p-5"
    data-testid="account-sessions"
  >
    <div>
      <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
        {{ props.labels.title }}
      </h2>
      <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
        {{ props.labels.subtitle }}
      </p>
    </div>

    <div
      v-if="error"
      class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200/80 bg-red-50/80 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30"
    >
      <p class="text-sm text-red-700 dark:text-red-300">
        {{ props.labels.loadError }}
      </p>
      <UiButton
        size="sm"
        variant="outline"
        :disabled="pending"
        @click="load()"
      >
        {{ props.labels.retry }}
      </UiButton>
    </div>

    <UiSkeleton
      v-else-if="pending"
      class="h-20 w-full"
    />

    <template v-else>
      <article
        v-if="currentSession"
        class="rounded-lg border border-brand-200/70 bg-brand-50/50 px-3 py-2.5 dark:border-brand-800/60 dark:bg-brand-950/40"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {{ deviceName(currentSession) }}
            </p>
            <p class="text-xs text-stone-600 dark:text-stone-400">
              {{ labels.lastActive }}: {{ formatRelative(currentSession.lastActiveAt) }}
              · {{ labels.current }}
            </p>
          </div>
        </div>
      </article>

      <ul
        v-if="visibleOthers.length"
        class="space-y-2"
      >
        <li
          v-for="session in visibleOthers"
          :key="session.id"
          class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200/80 px-3 py-2 dark:border-stone-700"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
              {{ deviceName(session) }}
            </p>
            <p class="text-xs text-stone-500 dark:text-stone-400">
              {{ labels.lastActive }}: {{ formatRelative(session.lastActiveAt) }}
            </p>
          </div>
          <UiButton
            size="sm"
            variant="outline"
            :loading="revokingId === session.id"
            @click="handleRevoke(session)"
          >
            {{ props.labels.revoke }}
          </UiButton>
        </li>
      </ul>

      <UiButton
        v-if="hiddenOthersCount > 0 && !showAllOthers"
        size="sm"
        variant="ghost"
        @click="showAllOthers = true"
      >
        {{ labels.showMore(hiddenOthersCount) }}
      </UiButton>

      <p
        v-if="!otherSessions.length"
        class="text-sm text-stone-600 dark:text-stone-400"
      >
        {{ props.labels.empty }}
      </p>

      <UiButton
        v-if="otherSessions.length"
        size="sm"
        variant="outline"
        :loading="revokingOthers"
        data-testid="revoke-other-sessions"
        @click="handleRevokeOthers"
      >
        {{ props.labels.revokeOthers }}
      </UiButton>
    </template>
  </section>
</template>
