<script setup lang="ts">
import type { BlogPost } from '#shared/types/blog'
import { sanitizeHtml, textLengthFromHtml } from '#shared/utils/sanitize-html'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
  staffRoles: ['admin', 'content_manager'],
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const { t: $t } = useI18n()
const localePath = useLocalePath()
const { fetchAdminPosts, createPost, updatePost } = useBlog()
const { fetchAdminPublishedListings } = useTeamBadges()

const { data: posts, refresh, pending } = await useAsyncData('admin-blog-posts', () => fetchAdminPosts())
const { data: listings } = await useAsyncData('admin-blog-listings', () => fetchAdminPublishedListings())

const editingId = ref<string | null>(null)
const saving = ref(false)
const contentLocale = ref<'ru' | 'en'>('ru')

const emptyForm = () => ({
  listingId: '',
  titleRu: '',
  titleEn: '',
  excerptRu: '',
  excerptEn: '',
  bodyRu: '',
  bodyEn: '',
  coverImageUrl: '',
  status: 'draft' as 'draft' | 'published',
})

const form = reactive(emptyForm())

const listingOptions = computed(() => [
  { value: '', label: $t('form.selectPlaceholder') },
  ...(listings.value ?? []).map(listing => ({
    value: listing.id,
    label: `${listing.title} — ${listing.city}`,
  })),
])

const statusOptions = computed(() => [
  { value: 'draft', label: t('draft') },
  { value: 'published', label: t('published') },
])

const resetForm = () => {
  Object.assign(form, emptyForm())
  editingId.value = null
}

const startEdit = (post: BlogPost) => {
  editingId.value = post.id
  form.listingId = post.listingId ?? ''
  form.titleRu = post.titleRu
  form.titleEn = post.titleEn
  form.excerptRu = post.excerptRu
  form.excerptEn = post.excerptEn
  form.bodyRu = post.bodyRu
  form.bodyEn = post.bodyEn
  form.coverImageUrl = post.coverImageUrl ?? ''
  form.status = post.status
}

const submit = async () => {
  if (!form.listingId || !form.titleRu.trim() || textLengthFromHtml(form.bodyRu) < 20) {
    return
  }

  saving.value = true

  const payload = {
    listingId: form.listingId,
    titleRu: form.titleRu.trim(),
    titleEn: form.titleEn.trim() || undefined,
    excerptRu: form.excerptRu.trim(),
    excerptEn: form.excerptEn.trim() || undefined,
    bodyRu: sanitizeHtml(form.bodyRu),
    bodyEn: form.bodyEn.trim() ? sanitizeHtml(form.bodyEn) : undefined,
    coverImageUrl: form.coverImageUrl.trim() || null,
    status: form.status,
  }

  try {
    if (editingId.value) {
      await updatePost(editingId.value, payload)
    } else {
      await createPost(payload)
    }
    resetForm()
    await refresh()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page-container max-w-4xl space-y-10">
    <div>
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </div>

    <form
      class="surface-card grid gap-3 p-4 sm:grid-cols-2"
      @submit.prevent="submit()"
    >
      <h2 class="sm:col-span-2 text-lg font-semibold text-stone-900 dark:text-stone-100">
        {{ editingId ? t('editTitle') : t('createTitle') }}
      </h2>

      <FormSelect
        v-model="form.listingId"
        class="sm:col-span-2"
        :label="t('listing')"
        :options="listingOptions"
        required
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
            v-model="form.excerptRu"
            :label="t('formExcerpt')"
            :rows="2"
          />
          <FormRichText
            v-model="form.bodyRu"
            :label="t('formBody')"
            required
          />
        </template>
        <template #en>
          <FormInput
            v-model="form.titleEn"
            :label="t('formTitle')"
          />
          <FormTextarea
            v-model="form.excerptEn"
            :label="t('formExcerpt')"
            :rows="2"
          />
          <FormRichText
            v-model="form.bodyEn"
            :label="t('formBody')"
            min-height-class="min-h-40"
          />
        </template>
      </FormLocaleTabs>
      <FormInput
        v-model="form.coverImageUrl"
        class="sm:col-span-2"
        :label="t('coverUrl')"
      />

      <FormSelect
        v-model="form.status"
        :label="t('status')"
        :options="statusOptions"
      />

      <div class="flex flex-wrap gap-2 sm:col-span-2">
        <UiButton
          type="submit"
          :loading="saving"
        >
          {{ editingId ? t('save') : t('create') }}
        </UiButton>
        <UiButton
          v-if="editingId"
          type="button"
          variant="outline"
          @click="resetForm()"
        >
          {{ t('cancelEdit') }}
        </UiButton>
      </div>
    </form>

    <section class="space-y-4">
      <h2 class="text-xl font-semibold text-stone-900 dark:text-stone-100">
        {{ t('posts') }}
      </h2>

      <p
        v-if="pending"
        class="text-sm text-stone-500"
      >
        {{ $t('common.loading') }}
      </p>

      <p
        v-else-if="!posts?.length"
        class="text-sm text-stone-600 dark:text-stone-400"
      >
        {{ t('empty') }}
      </p>

      <ul
        v-else
        class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
      >
        <li
          v-for="post in posts"
          :key="post.id"
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="font-medium text-stone-900 dark:text-stone-50">
              {{ post.titleRu }}
            </p>
            <p class="text-xs text-stone-500 dark:text-stone-400">
              {{ post.listingCity }} · {{ post.listingTitle }} · {{ post.status }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <NuxtLink
              v-if="post.status === 'published'"
              :to="localePath(`/blog/${post.slug}`)"
              class="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
              target="_blank"
            >
              {{ t('open') }}
            </NuxtLink>
            <UiButton
              size="sm"
              variant="secondary"
              @click="startEdit(post)"
            >
              {{ t('edit') }}
            </UiButton>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
