<script setup lang="ts">
import { formatMonthLabel, getCurrentMonthKey } from '#shared/utils/spotlight-month'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t, locale } = usePageI18n({ ru, en })
const route = useRoute()
const { isAuthenticated } = useAuth()
const { fetchPhotos, fetchVoteState, vote } = useSpotlight()

const monthKey = computed(() => getCurrentMonthKey())
const monthLabel = computed(() => formatMonthLabel(monthKey.value, locale.value))

const listingIdFromQuery = computed(() => {
  const value = route.query.listingId
  return typeof value === 'string' ? value : ''
})

const { data: photos, refresh: refreshPhotos, pending } = await useAsyncData(
  () => `spotlight-photos-${monthKey.value}`,
  () => fetchPhotos(monthKey.value),
)

const { data: voteState, refresh: refreshVote } = await useAsyncData(
  () => `spotlight-vote-${monthKey.value}-${isAuthenticated.value}`,
  () => fetchVoteState(monthKey.value),
  { watch: [isAuthenticated] },
)

const voteLoadingId = ref<string | null>(null)
const voteMessage = ref('')

const listingTitle = computed(() => {
  if (!listingIdFromQuery.value) {
    return ''
  }

  return photos.value?.find(photo => photo.listingId === listingIdFromQuery.value)?.listingTitle ?? ''
})

const onVote = async (photoId: string) => {
  if (!isAuthenticated.value) {
    voteMessage.value = t('loginToVote')
    return
  }

  if (voteState.value?.closed) {
    voteMessage.value = t('votingClosed')
    return
  }

  voteLoadingId.value = photoId
  voteMessage.value = ''

  try {
    await vote({ photoId, monthKey: monthKey.value })
    voteMessage.value = t('voteSaved')
    await Promise.all([refreshPhotos(), refreshVote()])
  } catch {
    voteMessage.value = t('voteFailed')
  } finally {
    voteLoadingId.value = null
  }
}

const onUploaded = async () => {
  await refreshPhotos()
}

useSiteSeo({
  title: t('title'),
  description: t('subtitle'),
})
</script>

<template>
  <div class="page-container space-y-10">
    <header class="max-w-2xl space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-brand-700 dark:text-brand-300">
        {{ t('monthLabel') }} · {{ monthLabel }}
      </p>
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="section-subtitle">
        {{ t('subtitle') }}
      </p>
    </header>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <section class="space-y-4">
        <p
          v-if="voteMessage"
          class="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:bg-brand-950 dark:text-brand-100"
        >
          {{ voteMessage }}
        </p>

        <div
          v-if="pending"
          class="grid gap-6 sm:grid-cols-2"
        >
          <UiSkeleton
            v-for="n in 4"
            :key="n"
            variant="card"
            class="aspect-4/3"
          />
        </div>

        <UiEmpty
          v-else-if="!photos?.length"
          icon="ph:camera-duotone"
          :title="t('empty')"
        />

        <div
          v-else
          class="grid gap-6 sm:grid-cols-2"
        >
          <SpotlightCard
            v-for="photo in photos"
            :key="photo.id"
            :photo="photo"
            :vote-disabled="voteState?.closed"
            :loading="voteLoadingId === photo.id"
            @vote="onVote"
          />
        </div>
      </section>

      <SpotlightUpload
        :listing-id="listingIdFromQuery || undefined"
        :listing-title="listingTitle"
        @uploaded="onUploaded"
      />
    </div>
  </div>
</template>
