<script setup lang="ts">
import type { HostListingActionsEmits, HostListingActionsProps } from './types'

const props = defineProps<HostListingActionsProps>()
const emit = defineEmits<HostListingActionsEmits>()
const localePath = useLocalePath()
const { t } = useI18n()

const actionClass = 'inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-brand-400'
const dangerClass = 'inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:text-stone-400 dark:hover:bg-red-950/50 dark:hover:text-red-400'

const isPublished = computed(() => props.status === 'published')
const isArchived = computed(() => props.status === 'archived')
</script>

<template>
  <div class="flex flex-wrap items-center justify-end gap-0.5">
    <NuxtLink
      v-if="isPublished"
      :to="localePath(`/host/listings/${listingId}/calendar`)"
      :class="actionClass"
      :title="t('hostListingActions.calendar')"
      :aria-label="t('hostListingActions.calendar')"
    >
      <Icon
        name="ph:calendar-duotone"
        class="size-5"
      />
    </NuxtLink>
    <NuxtLink
      v-if="isPublished"
      :to="localePath(`/host/listings/${listingId}/stories`)"
      :class="actionClass"
      :title="t('hostListingActions.stories')"
      :aria-label="t('hostListingActions.stories')"
    >
      <Icon
        name="ph:film-strip-duotone"
        class="size-5"
      />
    </NuxtLink>
    <NuxtLink
      v-if="isPublished"
      :to="localePath(`/host/listings/${listingId}/news`)"
      :class="actionClass"
      :title="t('hostListingActions.news')"
      :aria-label="t('hostListingActions.news')"
    >
      <Icon
        name="ph:newspaper-duotone"
        class="size-5"
      />
    </NuxtLink>
    <NuxtLink
      v-if="isPublished"
      :to="localePath(`/host/listings/${listingId}/promote`)"
      :class="actionClass"
      :title="t('hostListingActions.promote')"
      :aria-label="t('hostListingActions.promote')"
    >
      <Icon
        name="ph:megaphone-duotone"
        class="size-5"
      />
    </NuxtLink>
    <NuxtLink
      v-if="!isArchived"
      :to="localePath(`/host/listings/create?id=${listingId}`)"
      :class="actionClass"
      :title="t('hostListingActions.edit')"
      :aria-label="t('hostListingActions.edit')"
    >
      <Icon
        name="ph:pencil-simple-duotone"
        class="size-5"
      />
    </NuxtLink>
    <button
      v-if="!isArchived"
      type="button"
      :class="dangerClass"
      :title="t('hostListingActions.archive')"
      :aria-label="t('hostListingActions.archive')"
      :disabled="archiving"
      @click="emit('archive')"
    >
      <Icon
        name="ph:archive-duotone"
        class="size-5"
      />
    </button>
    <button
      v-else
      type="button"
      :class="actionClass"
      :title="t('hostListingActions.restore')"
      :aria-label="t('hostListingActions.restore')"
      :disabled="restoring"
      @click="emit('restore')"
    >
      <Icon
        name="ph:arrow-counter-clockwise-duotone"
        class="size-5"
      />
    </button>
  </div>
</template>
