<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t } = usePageI18n({ ru, en })
const route = useRoute()
const localePath = useLocalePath()
const { isAuthenticated, user } = useAuth()
const { fetchHostProfile, updateHostProfileDescription } = useHosts()
const { startConversation } = useConversations()

const messageLoading = ref(false)
const verificationModalOpen = ref(false)
const descriptionDraft = ref('')
const descriptionSaving = ref(false)
const descriptionEditing = ref(false)

const hostId = computed(() => String(route.params.id))

const isNotFoundError = (fetchError: unknown) =>
  (fetchError as { statusCode?: number })?.statusCode === 404

const { data: host, error, pending, refresh } = await useAsyncData(
  () => `host-${hostId.value}`,
  () => fetchHostProfile(hostId.value),
)

const showNotFound = computed(() => error.value && isNotFoundError(error.value))
const showLoadError = computed(() => error.value && !showNotFound.value)

watch(host, (value) => {
  descriptionDraft.value = value?.profileDescription ?? ''
}, { immediate: true })

watchEffect(() => {
  if (!host.value) {
    return
  }

  useSiteSeo({
    title: host.value.name ?? t('title'),
    description: host.value.profileDescription ?? `${host.value.listingsCount} ${t('listingsCount')}`,
  })
})

const isOwnProfile = computed(() =>
  isAuthenticated.value && user.value?.id === host.value?.id,
)

const canEditDescription = computed(() =>
  isOwnProfile.value && (user.value?.role === 'host' || user.value?.role === 'admin'),
)

const canMessageHost = computed(() =>
  isAuthenticated.value
  && host.value
  && user.value?.id !== host.value.id
  && host.value.listings.length > 0,
)

const startDescriptionEdit = () => {
  descriptionDraft.value = host.value?.profileDescription ?? ''
  descriptionEditing.value = true
}

const cancelDescriptionEdit = () => {
  descriptionDraft.value = host.value?.profileDescription ?? ''
  descriptionEditing.value = false
}

const saveDescription = async () => {
  descriptionSaving.value = true

  try {
    await updateHostProfileDescription({ description: descriptionDraft.value })
    descriptionEditing.value = false
    await refresh()
  } finally {
    descriptionSaving.value = false
  }
}

const messageHost = async () => {
  const listingId = host.value?.listings[0]?.id

  if (!listingId) {
    return
  }

  if (!isAuthenticated.value) {
    await navigateTo(localePath('/auth/login'))
    return
  }

  messageLoading.value = true

  try {
    const conversation = await startConversation({ listingId })
    await navigateTo(localePath(`/messages/${conversation.id}`))
  } finally {
    messageLoading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <HostProfileSkeleton v-if="pending && !host && !error" />

    <UiEmpty
      v-else-if="showNotFound"
      icon="ph:user-circle-duotone"
      :title="t('notFound')"
      :description="t('notFoundHint')"
    >
      <NuxtLink :to="localePath('/search')">
        <UiButton>{{ t('explore') }}</UiButton>
      </NuxtLink>
    </UiEmpty>

    <UiEmpty
      v-else-if="showLoadError"
      icon="ph:warning-circle-duotone"
      :title="t('loadError')"
      :description="t('loadErrorHint')"
    >
      <UiButton
        variant="outline"
        @click="refresh()"
      >
        {{ t('retry') }}
      </UiButton>
    </UiEmpty>

    <div
      v-else-if="host"
      class="space-y-8"
    >
      <header class="surface-card space-y-4 p-6 md:p-8">
        <div class="flex items-start gap-4">
          <div class="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
            {{ (host.name ?? '?').charAt(0).toUpperCase() }}
          </div>

          <div class="min-w-0 flex-1 space-y-2">
            <HostVerifiedBadge
              v-if="host.verification.isVerified"
              :verification="host.verification"
              @open-details="verificationModalOpen = true"
            />

            <h1 class="font-display text-3xl font-semibold text-stone-900 dark:text-stone-50">
              {{ host.name ?? t('title') }}
            </h1>

            <p class="text-sm text-stone-600 dark:text-stone-400">
              {{ t('memberSince') }} {{ host.memberSince }}
            </p>

            <div class="flex flex-wrap items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
              <span>{{ host.listingsCount }} {{ t('listingsCount') }}</span>

              <span
                v-if="host.reviewCount"
                class="flex items-center gap-1 font-medium text-stone-800 dark:text-stone-200"
              >
                <Icon
                  name="ph:star-fill"
                  class="size-4 text-accent-500"
                />
                {{ host.averageRating }}
                <span class="font-normal text-stone-500 dark:text-stone-400">
                  · {{ host.reviewCount }} {{ t('reviews') }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <section
          class="space-y-3 border-t border-stone-200 pt-4 dark:border-stone-800"
          data-testid="host-profile-description"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {{ t('aboutHost') }}
            </h2>
            <UiButton
              v-if="canEditDescription && !descriptionEditing"
              type="button"
              variant="outline"
              size="sm"
              data-testid="host-description-edit"
              @click="startDescriptionEdit()"
            >
              {{ host.profileDescription ? t('editDescription') : t('addDescription') }}
            </UiButton>
          </div>

          <form
            v-if="descriptionEditing"
            class="space-y-3"
            @submit.prevent="saveDescription()"
          >
            <FormTextarea
              v-model="descriptionDraft"
              :label="t('descriptionLabel')"
              :rows="5"
            />
            <div class="flex flex-wrap gap-2">
              <UiButton
                type="submit"
                :loading="descriptionSaving"
              >
                {{ t('saveDescription') }}
              </UiButton>
              <UiButton
                type="button"
                variant="outline"
                @click="cancelDescriptionEdit()"
              >
                {{ t('cancelDescription') }}
              </UiButton>
            </div>
          </form>

          <p
            v-else-if="host.profileDescription"
            class="whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-stone-300"
          >
            {{ host.profileDescription }}
          </p>

          <p
            v-else-if="!canEditDescription"
            class="text-sm text-stone-500 dark:text-stone-400"
          >
            {{ t('noDescription') }}
          </p>

          <p
            v-else
            class="text-sm text-stone-500 dark:text-stone-400"
          >
            {{ t('emptyDescriptionHint') }}
          </p>
        </section>

        <UiButton
          v-if="canMessageHost"
          variant="outline"
          :loading="messageLoading"
          data-testid="message-host-profile"
          @click="messageHost()"
        >
          <Icon
            name="ph:chat-circle-dots-duotone"
            class="mr-1.5 size-4"
          />
          {{ t('messageHost') }}
        </UiButton>
      </header>

      <section class="space-y-4">
        <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
          {{ t('listings') }}
        </h2>

        <UiEmpty
          v-if="!host.listings.length"
          icon="ph:house-line-duotone"
          :title="t('noListings')"
        />

        <div
          v-else
          class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        >
          <ListingCard
            v-for="listing in host.listings"
            :key="listing.id"
            :listing="listing"
          />
        </div>
      </section>

      <section
        v-if="host.news.length"
        class="space-y-4"
        data-testid="host-profile-news"
      >
        <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
          {{ t('news') }}
        </h2>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <ListingNewsCard
            v-for="item in host.news"
            :key="item.id"
            :item="item"
            :listing-id="item.listingId"
            :listing-title="item.listingTitle"
          />
        </div>
      </section>

      <HostVerificationModal
        v-if="host.verification.isVerified"
        v-model:open="verificationModalOpen"
        :verification="host.verification"
      />
    </div>
  </div>
</template>
