<script setup lang="ts">
import { authorizationHeaders } from '#shared/utils/auth-headers'
import type { ListingClaimRequest } from '#shared/types/listing-claim'
import type { ListingCard } from '#shared/types/listing'
import type { Review } from '#shared/types/review'
import type { User } from '#shared/types/user'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })

const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

type PendingReview = Review & {
  listingTitle: string
  authorName: string | null
}

const { data: listings, refresh, pending: listingsPending } = await useAsyncData('admin-moderation', () =>
  $fetch<ListingCard[]>('/api/admin/listings', { headers: authHeaders() }),
)

const { data: reviews, refresh: refreshReviews, pending: reviewsPending } = await useAsyncData('admin-reviews', () =>
  $fetch<PendingReview[]>('/api/admin/reviews', { headers: authHeaders() }),
)

const { data: archivedListings, refresh: refreshArchived, pending: archivedPending } = await useAsyncData('admin-archived', () =>
  $fetch<ListingCard[]>('/api/admin/listings/archived', { headers: authHeaders() }),
)

const { data: claimRequests, refresh: refreshClaims, pending: claimsPending } = await useAsyncData('admin-claims', () =>
  $fetch<ListingClaimRequest[]>('/api/admin/listing-claims', { headers: authHeaders() }),
)

const publishAsTeamById = reactive<Record<string, boolean>>({})
const claimHostIds = reactive<Record<string, string>>({})
const claimHostMatches = reactive<Record<string, User | null>>({})
const claimLookupPending = reactive<Record<string, boolean>>({})

const loadClaimHostMatch = async (claim: ListingClaimRequest) => {
  claimLookupPending[claim.id] = true

  try {
    const { user } = await $fetch<{ user: User | null }>('/api/admin/users/lookup', {
      headers: authHeaders(),
      query: { phone: claim.requesterPhone },
    })

    claimHostMatches[claim.id] = user

    if (user) {
      claimHostIds[claim.id] = user.id
    }
  } catch {
    claimHostMatches[claim.id] = null
  } finally {
    claimLookupPending[claim.id] = false
  }
}

watch(claimRequests, (claims) => {
  for (const claim of claims ?? []) {
    if (claimHostMatches[claim.id] === undefined) {
      void loadClaimHostMatch(claim)
    }
  }
}, { immediate: true })

const loading = computed(() =>
  listingsPending.value || reviewsPending.value || archivedPending.value || claimsPending.value,
)

const updateStatus = async (id: string, status: 'published' | 'archived' | 'draft') => {
  await $fetch(`/api/admin/listings/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: { status },
  })

  if (status === 'published' && publishAsTeamById[id]) {
    await $fetch(`/api/admin/listings/${id}/ownership`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: { managedByTeam: true },
    })
  }

  await refresh()
}

const approveClaim = async (claimId: string, assignRequesterAsHost = false) => {
  const hostUserId = claimHostIds[claimId]?.trim()

  if (!assignRequesterAsHost && !hostUserId) {
    return
  }

  await $fetch(`/api/admin/listing-claims/${claimId}/approve`, {
    method: 'POST',
    headers: authHeaders(),
    body: assignRequesterAsHost
      ? { assignRequesterAsHost: true }
      : { hostUserId },
  })

  await Promise.all([refreshClaims(), refresh()])
}

const rejectClaim = async (claimId: string) => {
  await $fetch(`/api/admin/listing-claims/${claimId}/reject`, {
    method: 'POST',
    headers: authHeaders(),
  })

  await refreshClaims()
}

const updateReviewStatus = async (id: string, status: 'approved' | 'rejected') => {
  await $fetch(`/api/admin/reviews/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: { status },
  })
  await refreshReviews()
}

const reindex = async () => {
  await $fetch('/api/admin/search/reindex', {
    method: 'POST',
    headers: authHeaders(),
  })
}

const restoreArchived = async (id: string) => {
  await $fetch(`/api/admin/listings/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: { status: 'draft' },
  })
  await refreshArchived()
}
</script>

<template>
  <div class="page-container max-w-4xl">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <UiButton @click="reindex()">
        {{ t('reindex') }}
      </UiButton>
    </div>

    <h2 class="mb-4 text-xl font-semibold text-stone-900 dark:text-stone-100">
      {{ t('moderation') }}
    </h2>

    <div
      v-if="loading"
      class="mb-10 space-y-4"
    >
      <div
        v-for="n in 2"
        :key="n"
        class="surface-card space-y-3 p-4"
      >
        <UiSkeleton variant="title" class="w-2/3" />
        <UiSkeleton class="w-1/3" />
      </div>
    </div>

    <p
      v-else-if="!listings?.length"
      class="mb-8 text-stone-600 dark:text-stone-400"
    >
      {{ t('empty') }}
    </p>

    <div
      v-else
      class="mb-10 space-y-4"
    >
      <article
        v-for="listing in listings"
        :key="listing.id"
        class="surface-card flex flex-wrap items-center justify-between gap-4 p-4"
      >
        <div>
          <h3 class="font-semibold text-stone-900 dark:text-stone-100">
            {{ listing.title }}
          </h3>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{ listing.city }}
          </p>
        </div>
        <div class="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:min-w-56">
          <FormCheckbox
            v-model="publishAsTeamById[listing.id]"
            :label="t('publishAsTeam')"
          />
          <div class="flex gap-2">
            <UiButton @click="updateStatus(listing.id, 'published')">
              {{ t('publish') }}
            </UiButton>
            <UiButton
              variant="secondary"
              @click="updateStatus(listing.id, 'archived')"
            >
              {{ t('reject') }}
            </UiButton>
          </div>
        </div>
      </article>
    </div>

    <h2 class="mb-4 text-xl font-semibold text-stone-900 dark:text-stone-100">
      {{ t('claimsTitle') }}
    </h2>

    <p
      v-if="!claimsPending && !claimRequests?.length"
      class="mb-10 text-stone-600 dark:text-stone-400"
    >
      {{ t('claimsEmpty') }}
    </p>

    <div
      v-else-if="claimRequests?.length"
      class="mb-10 space-y-4"
    >
      <article
        v-for="claim in claimRequests"
        :key="claim.id"
        class="surface-card space-y-4 p-4"
      >
        <div>
          <h3 class="font-semibold text-stone-900 dark:text-stone-100">
            {{ claim.listingTitle }}
          </h3>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{ claim.requesterName }} · {{ claim.requesterPhone }}
            <span v-if="claim.requesterEmail"> · {{ claim.requesterEmail }}</span>
          </p>
          <p
            v-if="claim.message"
            class="mt-2 text-sm text-stone-700 dark:text-stone-300"
          >
            {{ claim.message }}
          </p>
          <ul
            v-if="claim.attachments.length"
            class="mt-3 space-y-1.5"
          >
            <li
              v-for="file in claim.attachments"
              :key="file.id"
            >
              <a
                :href="file.fileUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
              >
                <Icon
                  name="ph:paperclip-duotone"
                  class="size-4 shrink-0"
                />
                {{ file.fileName }}
              </a>
            </li>
          </ul>
        </div>
        <p
          v-if="claimLookupPending[claim.id]"
          class="text-sm text-stone-500 dark:text-stone-400"
        >
          …
        </p>
        <p
          v-else-if="claimHostMatches[claim.id]"
          class="text-sm text-brand-800 dark:text-brand-200"
        >
          {{ t('claimHostFound') }}:
          {{ claimHostMatches[claim.id]?.name || claimHostMatches[claim.id]?.phone }}
          <span class="text-stone-500 dark:text-stone-400">({{ claimHostMatches[claim.id]?.id }})</span>
        </p>
        <p
          v-else
          class="text-sm text-stone-600 dark:text-stone-400"
        >
          {{ t('claimHostNotFound') }}
        </p>
        <FormInput
          :id="`claim-host-${claim.id}`"
          v-model="claimHostIds[claim.id]"
          :label="t('claimHostId')"
        />
        <div class="flex flex-wrap gap-2">
          <UiButton @click="approveClaim(claim.id)">
            {{ t('claimApprove') }}
          </UiButton>
          <UiButton
            variant="secondary"
            @click="approveClaim(claim.id, true)"
          >
            {{ t('claimApproveRequester') }}
          </UiButton>
          <UiButton
            variant="secondary"
            @click="rejectClaim(claim.id)"
          >
            {{ t('claimReject') }}
          </UiButton>
          <NuxtLink
            :to="`/listings/${claim.listingId}`"
            class="inline-flex items-center text-sm font-medium text-brand-700 dark:text-brand-400"
            target="_blank"
          >
            {{ t('claimOpenListing') }} →
          </NuxtLink>
        </div>
      </article>
    </div>

    <h2 class="mb-4 text-xl font-semibold text-stone-900 dark:text-stone-100">
      {{ t('archived') }}
    </h2>

    <div
      v-if="loading"
      class="mb-10 space-y-4"
    >
      <div
        v-for="n in 2"
        :key="`archived-${n}`"
        class="surface-card space-y-3 p-4"
      >
        <UiSkeleton variant="title" class="w-2/3" />
        <UiSkeleton class="w-1/3" />
      </div>
    </div>

    <p
      v-else-if="!archivedListings?.length"
      class="mb-10 text-stone-600 dark:text-stone-400"
    >
      {{ t('archivedEmpty') }}
    </p>

    <div
      v-else
      class="mb-10 space-y-4"
    >
      <article
        v-for="listing in archivedListings"
        :key="listing.id"
        class="surface-card flex flex-wrap items-center justify-between gap-4 p-4"
      >
        <div>
          <h3 class="font-semibold text-stone-900 dark:text-stone-100">
            {{ listing.title }}
          </h3>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{ listing.city }}
          </p>
        </div>
        <UiButton @click="restoreArchived(listing.id)">
          {{ t('restore') }}
        </UiButton>
      </article>
    </div>

    <h2 class="mb-4 text-xl font-semibold text-stone-900 dark:text-stone-100">
      {{ t('reviewModeration') }}
    </h2>

    <div
      v-if="loading"
      class="space-y-4"
    >
      <div
        v-for="n in 2"
        :key="`review-${n}`"
        class="surface-card space-y-3 p-4"
      >
        <UiSkeleton variant="title" class="w-2/3" />
        <UiSkeleton class="w-full" />
        <UiSkeleton class="w-4/5" />
      </div>
    </div>

    <p
      v-else-if="!reviews?.length"
      class="text-stone-600 dark:text-stone-400"
    >
      {{ t('reviewsEmpty') }}
    </p>

    <div
      v-else
      class="space-y-4"
    >
      <article
        v-for="review in reviews"
        :key="review.id"
        class="surface-card p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 class="font-semibold text-stone-900 dark:text-stone-100">
              {{ review.listingTitle }}
            </h3>
            <p class="text-sm text-stone-600 dark:text-stone-400">
              {{ review.authorName ?? t('anonymousGuest') }} · ★ {{ review.rating }}
            </p>
            <p class="mt-2 text-stone-700 dark:text-stone-300">
              {{ review.text }}
            </p>
          </div>
          <div class="flex gap-2">
            <UiButton @click="updateReviewStatus(review.id, 'approved')">
              {{ t('approveReview') }}
            </UiButton>
            <UiButton
              variant="secondary"
              @click="updateReviewStatus(review.id, 'rejected')"
            >
              {{ t('rejectReview') }}
            </UiButton>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
