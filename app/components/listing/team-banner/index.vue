<script setup lang="ts">
import type { ListingTeamBannerProps } from './types'
import ru from './i18n/ru'
import en from './i18n/en'

defineProps<ListingTeamBannerProps>()

const { t } = usePageI18n({ ru, en })
</script>

<template>
  <div
    class="team-editorial-banner relative overflow-hidden rounded-2xl border border-brand-200/80 bg-linear-to-br from-brand-50/90 via-white to-brand-100/40 px-5 py-4 dark:border-brand-800/60 dark:from-brand-950/50 dark:via-stone-900 dark:to-brand-950/30"
    data-testid="listing-team-banner"
  >
    <div
      class="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-brand-400/15 blur-3xl dark:bg-brand-500/10"
      aria-hidden="true"
    />

    <div class="relative flex items-start gap-4">
      <span
        class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-600 to-brand-800 text-white shadow-md shadow-brand-900/20 dark:from-brand-500 dark:to-brand-700"
        aria-hidden="true"
      >
        <Icon
          name="ph:tree-evergreen-duotone"
          class="size-6"
        />
      </span>

      <div class="min-w-0 flex-1 space-y-2">
        <p class="editorial-kicker editorial-kicker-leaf">
          {{ t('kicker') }}
        </p>
        <p class="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          {{ notice }}
        </p>
        <ListingTeamBadgeLink
          v-if="badge"
          :badge="badge"
          :to="badgeHref"
          size="sm"
          class="inline-flex"
        />
      </div>
    </div>
  </div>
</template>
