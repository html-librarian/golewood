<script setup lang="ts">
import { LISTING_STATUS_LABELS } from '#shared/types/listing'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const { locale } = useI18n()
const localePath = useLocalePath()
const { fetchHostListings, archiveListing, restoreListing } = useListings()

const archivingId = ref<string | null>(null)
const restoringId = ref<string | null>(null)
const statusFilter = ref<'all' | 'active' | 'archived'>('all')

const { data: listings, refresh, pending } = await useAsyncData('host-listings', () => fetchHostListings())

const filteredListings = computed(() => {
  if (!listings.value) {
    return []
  }

  const topLevel = listings.value.filter(listing => listing.kind !== 'unit')

  if (statusFilter.value === 'archived') {
    return topLevel.filter(listing => listing.status === 'archived')
  }

  if (statusFilter.value === 'active') {
    return topLevel.filter(listing => listing.status !== 'archived')
  }

  return topLevel
})

const handleArchive = async (listingId: string) => {
  archivingId.value = listingId

  try {
    await archiveListing(listingId)
    await refresh()
  } finally {
    archivingId.value = null
  }
}

const handleRestore = async (listingId: string) => {
  restoringId.value = listingId

  try {
    await restoreListing(listingId)
    await refresh()
  } finally {
    restoringId.value = null
  }
}
</script>

<template>
  <div class="page-container">
    <div class="mb-6 flex items-center justify-between gap-4">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <div class="flex flex-wrap gap-2">
        <NuxtLink :to="localePath('/host/properties/create')">
          <UiButton variant="secondary">
            {{ t('createProperty') }}
          </UiButton>
        </NuxtLink>
        <NuxtLink :to="localePath('/host/listings/create')">
          <UiButton>{{ t('create') }}</UiButton>
        </NuxtLink>
      </div>
    </div>

    <div class="mb-6 flex flex-wrap gap-2">
      <button
        v-for="option in ['all', 'active', 'archived'] as const"
        :key="option"
        type="button"
        class="chip"
        :class="statusFilter === option ? 'chip-active' : 'chip-inactive'"
        @click="statusFilter = option"
      >
        {{ t(`filters.${option}`) }}
      </button>
    </div>

    <div
      v-if="pending"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="surface-card space-y-3 p-4"
      >
        <UiSkeleton variant="card" />
        <UiSkeleton variant="title" />
        <UiSkeleton class="w-2/3" />
      </div>
    </div>

    <UiEmpty
      v-else-if="!filteredListings.length"
      icon="ph:house-duotone"
      :title="listings?.length ? t('emptyFiltered') : t('empty')"
    />

    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
    >
      <div
        v-for="listing in filteredListings"
        :key="listing.id"
        class="space-y-2"
      >
        <NuxtLink
          v-if="listing.kind === 'property'"
          :to="localePath(`/host/properties/${listing.id}`)"
        >
          <ListingCard :listing="listing" />
        </NuxtLink>
        <ListingCard
          v-else
          :listing="listing"
        />
        <div class="flex flex-wrap items-center justify-between gap-2 px-1">
          <div class="flex flex-wrap gap-1.5">
            <UiBadge
              v-if="listing.kind === 'property'"
              variant="brand"
            >
              {{ t('propertyBadge') }}
            </UiBadge>
            <UiBadge
              v-if="listing.kind === 'property' && listing.unitCount"
              variant="muted"
            >
              {{ t('unitsBadge', { count: listing.unitCount }) }}
            </UiBadge>
            <UiBadge variant="muted">
              {{ LISTING_STATUS_LABELS[listing.status][locale as 'ru' | 'en'] }}
            </UiBadge>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <NuxtLink
              v-if="listing.status === 'published'"
              :to="localePath(`/host/listings/${listing.id}/promote`)"
            >
              <UiButton
                size="sm"
                variant="secondary"
                data-testid="host-listing-promote"
              >
                {{ t('promote') }}
              </UiButton>
            </NuxtLink>
            <NuxtLink
              v-if="listing.status === 'published'"
              :to="localePath(`/host/listings/${listing.id}/gift-certificates`)"
            >
              <UiButton
                size="sm"
                variant="secondary"
              >
                {{ t('giftCertificates') }}
              </UiButton>
            </NuxtLink>
            <HostListingActions
              :listing-id="listing.id"
              :status="listing.status"
              :archiving="archivingId === listing.id"
              :restoring="restoringId === listing.id"
              @archive="handleArchive(listing.id)"
              @restore="handleRestore(listing.id)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
