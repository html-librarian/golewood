<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
})

const { t } = usePageI18n({ ru, en })
const route = useRoute()
const localePath = useLocalePath()
const {
  fetchHostListingById,
  fetchHostBlocks,
  addHostBlock,
  removeHostBlock,
  fetchCalendarSync,
  addCalendarFeed,
  removeCalendarFeed,
  syncCalendarFeed,
  syncAllCalendarFeeds,
  rotateCalendarExport,
} = useListings()

const listingId = computed(() => String(route.params.id))
const startDate = ref('')
const endDate = ref('')
const loading = ref(false)
const removingId = ref<string | null>(null)
const formError = ref('')
const calendarKey = ref(0)

const feedLabel = ref('')
const feedUrl = ref('')
const feedLoading = ref(false)
const feedError = ref('')
const syncingFeedId = ref<string | null>(null)
const syncingAll = ref(false)
const exportCopied = ref(false)

const { data: listing } = await useAsyncData(
  () => `host-listing-${listingId.value}`,
  () => fetchHostListingById(listingId.value),
)

const { data: blocks, refresh: refreshBlocks } = await useAsyncData(
  () => `host-blocks-${listingId.value}`,
  () => fetchHostBlocks(listingId.value),
)

const { data: sync, refresh: refreshSync } = await useAsyncData(
  () => `host-calendar-sync-${listingId.value}`,
  () => fetchCalendarSync(listingId.value),
)

const exportIcalUrl = computed(() =>
  sync.value?.exportUrl ? `${sync.value.exportUrl}.ics` : '',
)

const refreshCalendar = async () => {
  await Promise.all([refreshBlocks(), refreshSync()])
  calendarKey.value += 1
}

const handleAddBlock = async () => {
  if (!startDate.value || !endDate.value) {
    return
  }

  loading.value = true
  formError.value = ''

  try {
    await addHostBlock(listingId.value, startDate.value, endDate.value)
    startDate.value = ''
    endDate.value = ''
    await refreshCalendar()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : ''
    formError.value = message.includes('409') || message.includes('overlap')
      ? t('overlapError')
      : message
  } finally {
    loading.value = false
  }
}

const handleRemove = async (blockId: string) => {
  removingId.value = blockId
  formError.value = ''

  try {
    await removeHostBlock(listingId.value, blockId)
    await refreshCalendar()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : ''
    formError.value = message.includes('Imported') ? t('importRemoveHint') : message
  } finally {
    removingId.value = null
  }
}

const handleAddFeed = async () => {
  if (!feedLabel.value.trim() || !feedUrl.value.trim()) {
    return
  }

  feedLoading.value = true
  feedError.value = ''

  try {
    const feed = await addCalendarFeed(listingId.value, {
      label: feedLabel.value.trim(),
      feedUrl: feedUrl.value.trim(),
    })
    feedLabel.value = ''
    feedUrl.value = ''
    await refreshSync()
    syncingFeedId.value = feed.id
    await syncCalendarFeed(listingId.value, feed.id)
    await refreshCalendar()
  } catch {
    feedError.value = t('feedAddError')
  } finally {
    feedLoading.value = false
    syncingFeedId.value = null
  }
}

const handleSyncFeed = async (feedId: string) => {
  syncingFeedId.value = feedId

  try {
    await syncCalendarFeed(listingId.value, feedId)
    await refreshCalendar()
  } finally {
    syncingFeedId.value = null
  }
}

const handleSyncAll = async () => {
  syncingAll.value = true

  try {
    await syncAllCalendarFeeds(listingId.value)
    await refreshCalendar()
  } finally {
    syncingAll.value = false
  }
}

const handleRemoveFeed = async (feedId: string) => {
  await removeCalendarFeed(listingId.value, feedId)
  await refreshCalendar()
}

const copyExportUrl = async () => {
  if (!exportIcalUrl.value) {
    return
  }

  await navigator.clipboard.writeText(exportIcalUrl.value)
  exportCopied.value = true
  setTimeout(() => {
    exportCopied.value = false
  }, 2000)
}

const handleRotateExport = async () => {
  await rotateCalendarExport(listingId.value)
  await refreshSync()
}

const handleGridRange = async (start: string, end: string) => {
  loading.value = true
  formError.value = ''

  try {
    await addHostBlock(listingId.value, start, end)
    startDate.value = ''
    endDate.value = ''
    await refreshCalendar()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : ''
    formError.value = message.includes('409') || message.includes('overlap')
      ? t('overlapError')
      : message
  } finally {
    loading.value = false
  }
}

const handleGridRemove = async (blockId: string) => {
  await handleRemove(blockId)
}

const googleLabels = computed(() => ({
  title: t('google.title'),
  hint: t('google.hint'),
  connect: t('google.connect'),
  connectedAs: t('google.connectedAs'),
  disconnect: t('google.disconnect'),
  selectCalendar: t('google.selectCalendar'),
  feedLabel: t('google.feedLabel'),
  addFeed: t('google.addFeed'),
  adding: t('google.adding'),
  notConfiguredDev: t('google.notConfiguredDev'),
  loadCalendarsError: t('google.loadCalendarsError'),
  addFeedError: t('google.addFeedError'),
}))

const formatSyncTime = (iso: string | null) => {
  if (!iso) {
    return '—'
  }

  return new Date(iso).toLocaleString()
}
</script>

<template>
  <div class="page-container max-w-3xl">
    <NuxtLink
      :to="localePath('/host/listings')"
      class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
    >
      ← {{ t('back') }}
    </NuxtLink>

    <h1 class="section-title mb-2">
      {{ t('title') }}
    </h1>

    <p
      v-if="listing"
      class="mb-8 section-subtitle"
    >
      {{ listing.title }}
    </p>

    <section class="surface-card mb-10 space-y-4 p-5">
      <div>
        <h2 class="font-semibold text-stone-900 dark:text-stone-100">
          {{ t('syncTitle') }}
        </h2>
        <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {{ t('syncHint') }}
        </p>
      </div>

      <div class="rounded-xl border border-stone-200 bg-stone-50/80 p-4 dark:border-stone-700 dark:bg-stone-900/40">
        <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {{ t('exportTitle') }}
        </h3>
        <p class="mt-1 text-xs text-stone-600 dark:text-stone-400">
          {{ t('exportHint') }}
        </p>
        <p class="mt-3 text-xs font-medium text-stone-500 dark:text-stone-400">
          {{ t('exportUrlLabel') }}
        </p>
        <p class="mt-1 break-all font-mono text-xs text-brand-800 dark:text-brand-300">
          {{ exportIcalUrl }}
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <UiButton
            size="sm"
            variant="outline"
            @click="copyExportUrl"
          >
            {{ exportCopied ? t('copiedExport') : t('copyExport') }}
          </UiButton>
          <UiButton
            size="sm"
            variant="outline"
            @click="handleRotateExport"
          >
            {{ t('rotateExport') }}
          </UiButton>
        </div>
      </div>

      <HostCalendarGoogle
        :listing-id="listingId"
        :labels="googleLabels"
        @changed="refreshCalendar()"
      />

      <form
        class="space-y-3 border-t border-stone-200 pt-4 dark:border-stone-700"
        @submit.prevent="handleAddFeed"
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <FormInput
            v-model="feedLabel"
            :label="t('feedLabel')"
            :placeholder="t('feedNamePlaceholder')"
          />
          <FormInput
            v-model="feedUrl"
            :label="t('feedUrl')"
            :placeholder="t('feedUrlPlaceholder')"
          />
        </div>
        <p
          v-if="feedError"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ feedError }}
        </p>
        <div class="flex flex-wrap gap-2">
          <UiButton
            type="submit"
            size="sm"
            :loading="feedLoading"
          >
            {{ t('addFeed') }}
          </UiButton>
          <UiButton
            v-if="sync?.feeds.length"
            size="sm"
            variant="outline"
            :loading="syncingAll"
            @click="handleSyncAll"
          >
            {{ t('syncAll') }}
          </UiButton>
        </div>
      </form>

      <UiEmpty
        v-if="!sync?.feeds.length"
        icon="ph:arrows-clockwise-duotone"
        :title="t('feedsEmpty')"
        class="py-6"
      />

      <ul
        v-else
        class="space-y-3"
      >
        <li
          v-for="feed in sync.feeds"
          :key="feed.id"
          class="rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-medium text-stone-900 dark:text-stone-100">
                {{ feed.label }}
              </p>
              <p class="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <UiBadge
                  v-if="feed.feedType === 'google'"
                  variant="muted"
                >
                  {{ t('sourceGoogle') }}
                </UiBadge>
                <span class="break-all">{{ feed.feedUrl }}</span>
              </p>
              <p class="mt-2 text-xs text-stone-500 dark:text-stone-400">
                {{ t('lastSync') }}: {{ formatSyncTime(feed.lastSyncedAt) }}
              </p>
              <p
                v-if="feed.lastSyncError"
                class="mt-1 text-xs text-amber-700 dark:text-amber-400"
              >
                {{ t('syncError') }}: {{ feed.lastSyncError }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UiButton
                size="sm"
                variant="outline"
                :loading="syncingFeedId === feed.id"
                @click="handleSyncFeed(feed.id)"
              >
                {{ t('syncFeed') }}
              </UiButton>
              <button
                type="button"
                class="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                @click="handleRemoveFeed(feed.id)"
              >
                {{ t('removeFeed') }}
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <form
      class="surface-card mb-10 space-y-4 p-5"
      @submit.prevent="handleAddBlock"
    >
      <div>
        <h2 class="font-semibold text-stone-900 dark:text-stone-100">
          {{ t('addBlock') }}
        </h2>
        <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {{ t('addBlockHint') }}
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="form-label mb-1 block">{{ t('startDate') }}</span>
          <input
            v-model="startDate"
            type="date"
            required
            class="form-input"
          >
        </label>

        <label class="block text-sm">
          <span class="form-label mb-1 block">{{ t('endDate') }}</span>
          <input
            v-model="endDate"
            type="date"
            required
            class="form-input"
          >
        </label>
      </div>

      <p
        v-if="formError"
        class="text-sm text-red-600 dark:text-red-400"
      >
        {{ formError }}
      </p>

      <UiButton
        type="submit"
        :disabled="loading"
      >
        {{ t('submit') }}
      </UiButton>
    </form>

    <section
      v-if="listing"
      class="mb-10"
    >
      <h2 class="mb-2 font-semibold text-stone-900 dark:text-stone-100">
        {{ t('availabilityTitle') }}
      </h2>
      <p class="mb-4 text-sm text-stone-600 dark:text-stone-400">
        {{ t('gridBlockHint') }}
      </p>
      <div class="surface-card p-5">
        <BookingCalendar
          :key="calendarKey"
          v-model:check-in="startDate"
          v-model:check-out="endDate"
          :listing-id="listingId"
          host-manage
          data-testid="host-manage-calendar"
          @range-selected="handleGridRange"
          @remove-block="handleGridRemove"
        />
      </div>
    </section>

    <h2 class="mb-4 font-semibold text-stone-900 dark:text-stone-100">
      {{ t('blocksTitle') }}
    </h2>

    <UiEmpty
      v-if="!blocks?.length"
      icon="ph:calendar-x-duotone"
      :title="t('empty')"
    />

    <ul
      v-else
      class="space-y-3"
    >
      <li
        v-for="block in blocks"
        :key="block.id"
        class="surface-card flex flex-wrap items-center justify-between gap-4 px-4 py-3"
      >
        <div>
          <span class="text-stone-900 dark:text-stone-100">
            {{ block.startDate }} — {{ block.endDate }}
          </span>
          <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">
            <UiBadge
              variant="muted"
              class="mr-2"
            >
              {{
                block.source === 'import'
                  ? t('sourceImport')
                  : t('sourceManual')
              }}
            </UiBadge>
            <span v-if="block.feedLabel">{{ block.feedLabel }}</span>
          </p>
        </div>
        <button
          v-if="block.source === 'manual'"
          type="button"
          class="text-sm font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
          :disabled="removingId === block.id"
          @click="handleRemove(block.id)"
        >
          {{ t('remove') }}
        </button>
      </li>
    </ul>
  </div>
</template>
