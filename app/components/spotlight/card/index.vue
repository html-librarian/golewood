<script setup lang="ts">
import type { SpotlightCardEmits, SpotlightCardProps } from './types'

const props = defineProps<SpotlightCardProps>()
const emit = defineEmits<SpotlightCardEmits>()
const localePath = useLocalePath()

const displayTitle = computed(() =>
  props.photo.listingTitle ?? props.photo.placeName ?? '',
)

const hasListingLink = computed(() => Boolean(props.photo.listingId))
</script>

<template>
  <article class="surface-card overflow-hidden">
    <div class="relative aspect-4/3 bg-stone-100 dark:bg-stone-800">
      <img
        :src="photo.imageUrl"
        :alt="displayTitle"
        class="size-full object-cover"
        loading="lazy"
      >
      <p
        v-if="photo.userVoted || voted"
        class="absolute right-2 top-2 rounded-full bg-brand-600 px-2 py-1 text-xs font-semibold text-white dark:bg-brand-500"
      >
        {{ $t('spotlight.yourVote') }}
      </p>
    </div>

    <div class="space-y-3 p-4">
      <div>
        <NuxtLink
          v-if="hasListingLink"
          :to="localePath(`/listings/${photo.listingId}`)"
          class="font-semibold text-stone-900 hover:text-brand-700 dark:text-stone-50 dark:hover:text-brand-300"
        >
          {{ displayTitle }}
        </NuxtLink>
        <p
          v-else-if="displayTitle"
          class="font-semibold text-stone-900 dark:text-stone-50"
        >
          {{ displayTitle }}
        </p>
        <p
          v-if="photo.listingCity"
          class="text-sm text-stone-500 dark:text-stone-400"
        >
          {{ photo.listingCity }}
        </p>
        <div
          v-if="!hasListingLink && (photo.externalSiteUrl || photo.externalInstagram)"
          class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm"
        >
          <a
            v-if="photo.externalSiteUrl"
            :href="photo.externalSiteUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            {{ $t('spotlight.externalSite') }}
          </a>
          <a
            v-if="photo.externalInstagram"
            :href="photo.externalInstagram"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            Instagram
          </a>
        </div>
        <p
          v-if="photo.caption"
          class="mt-2 text-sm text-stone-600 dark:text-stone-300"
        >
          {{ photo.caption }}
        </p>
      </div>

      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-medium text-stone-700 dark:text-stone-300">
          ★ {{ photo.voteCount }}
          <span class="font-normal text-stone-500 dark:text-stone-400">
            · {{ photo.authorName ?? $t('spotlight.anonymous') }}
          </span>
        </p>

        <UiButton
          size="sm"
          :variant="photo.userVoted || voted ? 'secondary' : 'primary'"
          :disabled="voteDisabled || loading"
          @click="emit('vote', photo.id)"
        >
          {{ photo.userVoted || voted ? $t('spotlight.voted') : $t('spotlight.vote') }}
        </UiButton>
      </div>
    </div>
  </article>
</template>
