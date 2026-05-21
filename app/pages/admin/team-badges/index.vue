<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'], pageTransition: false })

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const {
  fetchAdminTeamBadges,
  createTeamBadge,
  updateTeamBadge,
  fetchAdminPublishedListings,
  assignListingTeamBadge,
} = useTeamBadges()
const { fetchAdminPosts } = useBlog()

const { data: badges, refresh: refreshBadges, pending: badgesPending } = await useAsyncData(
  'admin-team-badges',
  () => fetchAdminTeamBadges(),
)

const { data: publishedListings, refresh: refreshListings, pending: listingsPending } = await useAsyncData(
  'admin-published-listings-badges',
  () => fetchAdminPublishedListings(),
)

const form = reactive({
  slug: '',
  icon: 'ph:seal-check-duotone',
  titleRu: '',
  titleEn: '',
  descriptionRu: '',
  descriptionEn: '',
})

const saving = ref(false)
const contentLocale = ref<'ru' | 'en'>('ru')
const assignLoadingId = ref<string | null>(null)
const assignError = ref('')

const assignDraft = ref<Record<string, { badgeId: string, blogPostId: string }>>({})
const blogPostsByListing = ref<Record<string, Awaited<ReturnType<typeof fetchAdminPosts>>>>({})

const loadBlogPostsForListing = async (listingId: string) => {
  if (blogPostsByListing.value[listingId]) {
    return
  }

  try {
    blogPostsByListing.value[listingId] = await fetchAdminPosts(listingId)
  } catch {
    blogPostsByListing.value[listingId] = []
  }
}

const syncAssignDraftFromListings = (list: NonNullable<typeof publishedListings.value>) => {
  const next: Record<string, { badgeId: string, blogPostId: string }> = {}

  for (const listing of list) {
    next[listing.id] = {
      badgeId: listing.teamBadge?.id ?? '',
      blogPostId: listing.teamBadgeBlogPost?.id ?? '',
    }
  }

  assignDraft.value = next

  for (const listing of list) {
    if (listing.teamBadge?.requiresBlogPost) {
      void loadBlogPostsForListing(listing.id)
    }
  }
}

watch(publishedListings, (list) => {
  if (!list) {
    return
  }

  syncAssignDraftFromListings(list)
}, { immediate: true, flush: 'sync' })

const badgeOptions = computed(() => badges.value?.filter(badge => badge.active) ?? [])

const selectedBadge = (listingId: string) => {
  const badgeId = assignDraft.value[listingId]?.badgeId
  return badgeOptions.value.find(badge => badge.id === badgeId) ?? null
}

const badgeRequiresBlog = (listingId: string) => selectedBadge(listingId)?.requiresBlogPost ?? false

const onBadgeChange = async (listingId: string, badgeId: string) => {
  if (!assignDraft.value[listingId]) {
    assignDraft.value[listingId] = { badgeId: '', blogPostId: '' }
  }

  assignDraft.value[listingId].badgeId = badgeId
  assignDraft.value[listingId].blogPostId = ''

  if (badgeId) {
    const badge = badgeOptions.value.find(item => item.id === badgeId)
    if (badge?.requiresBlogPost) {
      await loadBlogPostsForListing(listingId)
    }
  }
}

const publishedBlogPostsForListing = (listingId: string) =>
  (blogPostsByListing.value[listingId] ?? []).filter(post => post.status === 'published')

const addBadge = async () => {
  if (!form.slug.trim() || !form.titleRu.trim()) {
    return
  }

  saving.value = true

  try {
    await createTeamBadge({
      slug: form.slug.trim(),
      icon: form.icon.trim(),
      titleRu: form.titleRu.trim(),
      titleEn: form.titleEn.trim() || form.titleRu.trim(),
      descriptionRu: form.descriptionRu.trim(),
      descriptionEn: form.descriptionEn.trim() || form.descriptionRu.trim(),
      active: true,
      sortOrder: (badges.value?.length ?? 0) + 1,
    })
    form.slug = ''
    form.titleRu = ''
    form.titleEn = ''
    form.descriptionRu = ''
    form.descriptionEn = ''
    await refreshBadges()
  } finally {
    saving.value = false
  }
}

const toggleActive = async (id: string, active: boolean) => {
  await updateTeamBadge(id, { active: !active })
  await refreshBadges()
}

const saveAssign = async (listingId: string) => {
  const draft = assignDraft.value[listingId]
  assignLoadingId.value = listingId
  assignError.value = ''

  try {
    await assignListingTeamBadge(listingId, {
      teamBadgeId: draft?.badgeId || null,
      blogPostId: draft?.blogPostId || null,
    })
    await refreshListings()
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'data' in err
      && err.data && typeof err.data === 'object' && 'statusMessage' in err.data
      ? String((err.data as { statusMessage: string }).statusMessage)
      : t('assignFailed')
    assignError.value = message
  } finally {
    assignLoadingId.value = null
  }
}
</script>

<template>
  <div class="page-container max-w-4xl space-y-10">
    <h1 class="section-title">
      {{ t('title') }}
    </h1>

    <form
      class="surface-card grid gap-3 p-4 sm:grid-cols-2"
      @submit.prevent="addBadge()"
    >
      <FormInput
        v-model="form.slug"
        :label="t('slug')"
        placeholder="team_visited"
      />
      <FormInput
        v-model="form.icon"
        :label="t('icon')"
        placeholder="ph:footprints-duotone"
      />
      <FormLocaleTabs
        v-model="contentLocale"
        class="sm:col-span-2"
        ru-required
      >
        <template #ru>
          <FormInput
            v-model="form.titleRu"
            :label="t('formTitle')"
            required
          />
          <FormTextarea
            v-model="form.descriptionRu"
            :label="t('formDescription')"
            :rows="2"
          />
        </template>
        <template #en>
          <FormInput
            v-model="form.titleEn"
            :label="t('formTitle')"
          />
          <FormTextarea
            v-model="form.descriptionEn"
            :label="t('formDescription')"
            :rows="2"
          />
        </template>
      </FormLocaleTabs>
      <UiButton
        type="submit"
        class="sm:col-span-2"
        :loading="saving"
      >
        {{ t('add') }}
      </UiButton>
    </form>

    <ul
      v-if="!badgesPending"
      class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
    >
      <li
        v-for="item in badges ?? []"
        :key="item.id"
        class="flex items-center justify-between gap-3 px-4 py-3"
      >
        <div>
          <p class="font-medium text-stone-900 dark:text-stone-50">
            {{ item.titleRu }}
          </p>
          <p class="text-xs text-stone-500 dark:text-stone-400">
            {{ item.slug }}
            <span v-if="item.requiresBlogPost"> · {{ t('requiresBlog') }}</span>
          </p>
        </div>
        <UiButton
          size="sm"
          :variant="item.active ? 'secondary' : 'outline'"
          @click="toggleActive(item.id, item.active)"
        >
          {{ item.active ? t('active') : t('inactive') }}
        </UiButton>
      </li>
    </ul>

    <section class="space-y-4">
      <div>
        <h2 class="text-xl font-semibold text-stone-900 dark:text-stone-100">
          {{ t('assignTitle') }}
        </h2>
        <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {{ t('assignHint') }}
        </p>
        <NuxtLink
          :to="localePath('/admin/blog')"
          class="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
        >
          {{ t('blogLink') }} →
        </NuxtLink>
      </div>

      <p
        v-if="assignError"
        class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200"
      >
        {{ assignError }}
      </p>

      <p
        v-if="listingsPending"
        class="text-sm text-stone-500"
      >
        {{ $t('common.loading') }}
      </p>

      <ul
        v-else
        class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
      >
        <li
          v-for="listing in publishedListings ?? []"
          :key="listing.id"
          class="space-y-3 px-4 py-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium text-stone-900 dark:text-stone-50">
                {{ listing.title }}
              </p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ listing.city }}
              </p>
              <ListingTeamBadge
                v-if="listing.teamBadge"
                class="mt-2"
                :badge="listing.teamBadge"
              />
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1">
              <span class="text-xs font-medium text-stone-600 dark:text-stone-400">{{ t('badgeLabel') }}</span>
              <select
                class="form-select w-full"
                :value="assignDraft[listing.id]?.badgeId ?? ''"
                @change="onBadgeChange(listing.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">
                  {{ t('noBadge') }}
                </option>
                <option
                  v-for="badge in badgeOptions"
                  :key="badge.id"
                  :value="badge.id"
                >
                  {{ badge.titleRu }}
                </option>
              </select>
            </label>

            <label
              v-if="badgeRequiresBlog(listing.id) && assignDraft[listing.id]"
              class="flex flex-col gap-1"
            >
              <span class="text-xs font-medium text-stone-600 dark:text-stone-400">{{ t('blogPostLabel') }}</span>
              <select
                v-model="assignDraft[listing.id]!.blogPostId"
                class="form-select w-full"
                required
              >
                <option value="">
                  {{ t('selectBlogPost') }}
                </option>
                <option
                  v-for="post in publishedBlogPostsForListing(listing.id)"
                  :key="post.id"
                  :value="post.id"
                >
                  {{ post.titleRu }}
                </option>
              </select>
              <p
                v-if="!publishedBlogPostsForListing(listing.id).length"
                class="text-xs text-amber-700 dark:text-amber-400"
              >
                {{ t('noBlogPosts') }}
              </p>
            </label>
          </div>

          <UiButton
            size="sm"
            :loading="assignLoadingId === listing.id"
            @click="saveAssign(listing.id)"
          >
            {{ t('saveAssign') }}
          </UiButton>
        </li>
      </ul>
    </section>
  </div>
</template>
