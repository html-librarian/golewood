<script setup lang="ts">
import type { HostCalendarGoogleEmits, HostCalendarGoogleProps } from './types'

const props = defineProps<HostCalendarGoogleProps>()
const emit = defineEmits<HostCalendarGoogleEmits>()

const {
  fetchGoogleCalendarStatus,
  fetchGoogleCalendars,
  addGoogleCalendarFeed,
  disconnectGoogleCalendar,
} = useListings()

const feedLabel = ref('Google Calendar')
const selectedCalendarId = ref('')
const adding = ref(false)
const feedError = ref('')
const calendarsError = ref('')

const { data: status, refresh: refreshStatus } = await useAsyncData(
  'google-calendar-status',
  () => fetchGoogleCalendarStatus(),
)

const { data: calendars, refresh: refreshCalendars } = await useAsyncData(
  () => `google-calendars-${status.value?.connected}`,
  async () => {
    if (!status.value?.connected) {
      return []
    }

    try {
      const result = await fetchGoogleCalendars()
      calendarsError.value = ''
      return result.calendars
    } catch {
      calendarsError.value = props.labels.loadCalendarsError
      return []
    }
  },
  { watch: [status] },
)

watch(
  () => calendars.value,
  (items) => {
    if (!selectedCalendarId.value && items?.length) {
      const primary = items.find(item => item.primary) ?? items[0]
      selectedCalendarId.value = primary.id
      feedLabel.value = primary.summary
    }
  },
  { immediate: true },
)

const connectUrl = computed(() =>
  `/api/host/google-calendar/connect?listingId=${encodeURIComponent(props.listingId)}`,
)

const handleDisconnect = async () => {
  await disconnectGoogleCalendar()
  selectedCalendarId.value = ''
  await refreshStatus()
  await refreshCalendars()
  emit('changed')
}

const handleAddFeed = async () => {
  if (!selectedCalendarId.value) {
    return
  }

  adding.value = true
  feedError.value = ''

  try {
    await addGoogleCalendarFeed(props.listingId, {
      label: feedLabel.value.trim() || 'Google Calendar',
      googleCalendarId: selectedCalendarId.value,
    })
    emit('changed')
  } catch {
    feedError.value = props.labels.addFeedError
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div
    class="rounded-xl border border-stone-200 bg-stone-50/80 p-4 dark:border-stone-700 dark:bg-stone-900/40"
    data-testid="host-google-calendar"
  >
    <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">
      {{ labels.title }}
    </h3>
    <p class="mt-1 text-xs text-stone-600 dark:text-stone-400">
      {{ labels.hint }}
    </p>

    <p
      v-if="status && !status.configured"
      class="mt-3 text-xs text-amber-700 dark:text-amber-400"
    >
      {{ labels.notConfiguredDev }}
    </p>

    <div
      v-if="!status?.connected"
      class="mt-4"
    >
      <a
        :href="connectUrl"
        class="inline-flex h-9 items-center rounded-xl bg-brand-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500"
        data-testid="google-calendar-connect"
      >
        {{ labels.connect }}
      </a>
    </div>

    <template v-else>
      <p class="mt-3 text-sm text-stone-700 dark:text-stone-300">
        {{ labels.connectedAs }}
        <span class="font-medium">{{ status.googleEmail ?? 'Google' }}</span>
      </p>

      <div class="mt-3 flex flex-wrap gap-2">
        <UiButton
          size="sm"
          variant="outline"
          data-testid="google-calendar-disconnect"
          @click="handleDisconnect()"
        >
          {{ labels.disconnect }}
        </UiButton>
      </div>

      <form
        class="mt-4 space-y-3 border-t border-stone-200 pt-4 dark:border-stone-700"
        @submit.prevent="handleAddFeed"
      >
        <p
          v-if="calendarsError"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ calendarsError }}
        </p>

        <label class="block text-sm">
          <span class="form-label mb-1 block">{{ labels.selectCalendar }}</span>
          <select
            v-model="selectedCalendarId"
            class="form-input"
            data-testid="google-calendar-select"
          >
            <option
              v-for="calendar in calendars ?? []"
              :key="calendar.id"
              :value="calendar.id"
            >
              {{ calendar.summary }}
            </option>
          </select>
        </label>

        <FormInput
          v-model="feedLabel"
          :label="labels.feedLabel"
        />

        <p
          v-if="feedError"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ feedError }}
        </p>

        <UiButton
          type="submit"
          size="sm"
          :loading="adding"
        >
          {{ adding ? labels.adding : labels.addFeed }}
        </UiButton>
      </form>
    </template>
  </div>
</template>
