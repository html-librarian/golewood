<script setup lang="ts">
import type { ListingHostToolbarProps } from './types'

defineProps<ListingHostToolbarProps>()

const localePath = useLocalePath()
</script>

<template>
  <section
    class="rounded-2xl border border-brand-200/80 bg-brand-50/60 p-4 dark:border-brand-800/60 dark:bg-brand-950/40"
    data-testid="listing-host-toolbar"
  >
    <p class="mb-3 text-sm font-semibold text-brand-900 dark:text-brand-100">
      {{ labels.title }}
    </p>
    <div class="flex flex-wrap gap-2">
      <NuxtLink :to="localePath(`/host/listings/create?id=${listingId}`)">
        <UiButton
          size="sm"
          variant="primary"
        >
          <Icon
            name="ph:pencil-simple-duotone"
            class="mr-1.5 size-4"
          />
          {{ labels.edit }}
        </UiButton>
      </NuxtLink>
      <NuxtLink :to="localePath(`/host/listings/${listingId}/news`)">
        <UiButton
          size="sm"
          variant="outline"
        >
          <Icon
            name="ph:newspaper-duotone"
            class="mr-1.5 size-4"
          />
          {{ labels.news }}
        </UiButton>
      </NuxtLink>
      <NuxtLink :to="localePath(`/host/listings/${listingId}/calendar`)">
        <UiButton
          size="sm"
          variant="outline"
        >
          <Icon
            name="ph:calendar-duotone"
            class="mr-1.5 size-4"
          />
          {{ labels.calendar }}
        </UiButton>
      </NuxtLink>
      <NuxtLink :to="localePath('/host/listings')">
        <UiButton
          size="sm"
          variant="ghost"
        >
          <Icon
            name="ph:squares-four-duotone"
            class="mr-1.5 size-4"
          />
          {{ labels.manage }}
        </UiButton>
      </NuxtLink>
    </div>
  </section>
</template>
