<script setup lang="ts">
import { LISTING_NEWS_GALLERY_MAX } from '#shared/constants/listing-news'
import type { ListingNewsItem } from '#shared/types/listing-news'
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
const route = useRoute()
const localePath = useLocalePath()
const {
  fetchHostNews,
  createNews,
  updateNews,
  deleteNews,
  uploadPreview,
  uploadMedia,
  addMediaEmbed,
  removeMedia,
} = useListingNews()

const listingId = computed(() => String(route.params.id))
const saving = ref(false)
const uploading = ref(false)
const editingId = ref<string | null>(null)
const previewFile = ref<File | null>(null)
const previewPreviewUrl = ref<string | null>(null)
const galleryFiles = ref<File[]>([])
const videoEmbedUrl = ref('')

const form = reactive({
  title: '',
  excerpt: '',
  body: '',
  showBookingButton: false,
  status: 'published' as 'draft' | 'published',
})

const { data: news, refresh, pending } = await useAsyncData(
  () => `host-listing-news-${listingId.value}`,
  () => fetchHostNews(listingId.value),
)

const editingItem = computed(() =>
  news.value?.find(item => item.id === editingId.value) ?? null,
)

const galleryCount = computed(() => editingItem.value?.media?.length ?? 0)
const canAddGallery = computed(() => galleryCount.value < LISTING_NEWS_GALLERY_MAX)

const statusOptions = computed(() => [
  { value: 'draft', label: t('draft') },
  { value: 'published', label: t('published') },
])

const resetForm = () => {
  form.title = ''
  form.excerpt = ''
  form.body = ''
  form.showBookingButton = false
  form.status = 'published'
  editingId.value = null
  previewFile.value = null
  previewPreviewUrl.value = null
  galleryFiles.value = []
  videoEmbedUrl.value = ''
}

const startEdit = (item: ListingNewsItem) => {
  editingId.value = item.id
  form.title = item.title
  form.excerpt = item.excerpt
  form.body = item.body
  form.showBookingButton = item.showBookingButton
  form.status = item.status
  previewPreviewUrl.value = item.previewImageUrl
  previewFile.value = null
}

const onPreviewSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  previewFile.value = file
  previewPreviewUrl.value = URL.createObjectURL(file)
  input.value = ''
}

const onGallerySelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  galleryFiles.value = files
  input.value = ''
}

const submit = async () => {
  if (!form.title.trim() || form.excerpt.trim().length < 10 || textLengthFromHtml(form.body) < 10) {
    return
  }

  saving.value = true

  try {
    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      body: sanitizeHtml(form.body),
      showBookingButton: form.showBookingButton,
      status: form.status,
    }

    let newsId = editingId.value

    if (newsId) {
      await updateNews(listingId.value, newsId, payload)
    } else {
      const created = await createNews(listingId.value, payload)
      newsId = created.id
      editingId.value = newsId
    }

    if (newsId && previewFile.value) {
      uploading.value = true
      await uploadPreview(listingId.value, newsId, previewFile.value)
      previewFile.value = null
    }

    if (newsId && galleryFiles.value.length) {
      uploading.value = true
      let mediaTotal = editingItem.value?.media?.length ?? 0
      for (const file of galleryFiles.value) {
        if (mediaTotal >= LISTING_NEWS_GALLERY_MAX) {
          break
        }
        await uploadMedia(listingId.value, newsId, file)
        mediaTotal += 1
      }
      galleryFiles.value = []
    }

    if (newsId && videoEmbedUrl.value.trim()) {
      uploading.value = true
      await addMediaEmbed(listingId.value, newsId, videoEmbedUrl.value.trim())
      videoEmbedUrl.value = ''
    }

    await refresh()

    if (editingItem.value) {
      startEdit(editingItem.value)
    }
  } finally {
    saving.value = false
    uploading.value = false
  }
}

const remove = async (newsId: string) => {
  await deleteNews(listingId.value, newsId)

  if (editingId.value === newsId) {
    resetForm()
  }

  await refresh()
}

const removeGalleryItem = async (mediaId: string) => {
  if (!editingId.value) {
    return
  }

  await removeMedia(listingId.value, editingId.value, mediaId)
  await refresh()

  if (editingItem.value) {
    startEdit(editingItem.value)
  }
}

onBeforeUnmount(() => {
  if (previewPreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewPreviewUrl.value)
  }
})
</script>

<template>
  <div class="page-container max-w-2xl space-y-8">
    <NuxtLink
      :to="localePath('/admin/news')"
      class="inline-flex text-sm text-brand-700 hover:underline dark:text-brand-400"
    >
      ← {{ t('back') }}
    </NuxtLink>

    <h1 class="section-title">
      {{ t('title') }}
    </h1>

    <form
      class="surface-card space-y-4 p-5"
      @submit.prevent="submit()"
    >
      <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">
        {{ editingId ? t('editTitle') : t('createTitle') }}
      </h2>

      <FormInput
        v-model="form.title"
        :label="t('newsTitle')"
        required
      />
      <FormTextarea
        v-model="form.excerpt"
        :label="t('excerpt')"
        :rows="3"
        required
      />
      <FormRichText
        v-model="form.body"
        :label="t('body')"
        required
      />

      <FormCheckbox
        v-model="form.showBookingButton"
        :label="t('showBookingButton')"
      />

      <div class="space-y-2">
        <p class="text-sm font-medium text-stone-700 dark:text-stone-300">
          {{ t('previewImage') }}
        </p>
        <p class="text-xs text-stone-500 dark:text-stone-400">
          {{ t('previewHint') }}
        </p>
        <div
          v-if="previewPreviewUrl"
          class="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700"
        >
          <ListingImage
            :src="previewPreviewUrl"
            :alt="form.title"
            class="aspect-video w-full object-cover"
          />
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-800 dark:text-stone-400 dark:file:bg-brand-950 dark:file:text-brand-200"
          :aria-label="t('previewImage')"
          :disabled="!editingId && !saving"
          @change="onPreviewSelected"
        >
        <p
          v-if="!editingId"
          class="text-xs text-stone-500 dark:text-stone-400"
        >
          {{ t('saveFirst') }}
        </p>
      </div>

      <div class="space-y-3 border-t border-stone-200 pt-4 dark:border-stone-800">
        <div>
          <p class="text-sm font-medium text-stone-700 dark:text-stone-300">
            {{ t('gallery') }}
          </p>
          <p class="text-xs text-stone-500 dark:text-stone-400">
            {{ t('galleryHint') }} ({{ galleryCount }}/{{ LISTING_NEWS_GALLERY_MAX }})
          </p>
        </div>

        <div
          v-if="editingItem?.media?.length"
          class="grid gap-2 sm:grid-cols-2"
        >
          <div
            v-for="media in editingItem.media"
            :key="media.id"
            class="relative overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700"
          >
            <iframe
              v-if="media.mediaType === 'video' && media.embedUrl"
              :src="media.embedUrl"
              class="aspect-video w-full border-0"
              allowfullscreen
              :title="form.title"
            />
            <video
              v-else-if="media.mediaType === 'video'"
              :src="media.url"
              class="aspect-video w-full object-cover"
              controls
              playsinline
            />
            <ListingImage
              v-else
              :src="media.url"
              :alt="form.title"
              class="aspect-video w-full object-cover"
            />
            <button
              type="button"
              class="absolute right-2 top-2 rounded-full bg-stone-900/70 p-1.5 text-white transition hover:bg-stone-900"
              @click="removeGalleryItem(media.id)"
            >
              <Icon
                name="ph:x-bold"
                class="size-4"
              />
            </button>
          </div>
        </div>

        <template v-if="editingId && canAddGallery">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            class="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:text-stone-400 dark:file:bg-stone-800"
            :aria-label="t('gallery')"
            @change="onGallerySelected"
          >
          <div class="flex flex-wrap gap-2">
            <FormInput
              v-model="videoEmbedUrl"
              :label="t('videoUrl')"
              class="min-w-0 flex-1"
            />
          </div>
        </template>
        <p
          v-else-if="!editingId"
          class="text-xs text-stone-500 dark:text-stone-400"
        >
          {{ t('saveFirst') }}
        </p>
      </div>

      <FormSelect
        v-model="form.status"
        :label="t('status')"
        :options="statusOptions"
      />

      <div class="flex flex-wrap gap-2">
        <UiButton
          type="submit"
          :loading="saving || uploading"
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

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">
        {{ t('listTitle') }}
      </h2>

      <p
        v-if="pending"
        class="text-sm text-stone-500"
      >
        {{ $t('common.loading') }}
      </p>

      <UiEmpty
        v-else-if="!news?.length"
        icon="ph:newspaper-duotone"
        :title="t('empty')"
      />

      <ul
        v-else
        class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
      >
        <li
          v-for="item in news"
          :key="item.id"
          class="space-y-2 px-4 py-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="flex gap-3">
              <div
                v-if="item.previewImageUrl"
                class="size-14 shrink-0 overflow-hidden rounded-lg"
              >
                <ListingImage
                  :src="item.previewImageUrl"
                  :alt="item.title"
                  class="size-full object-cover"
                />
              </div>
              <div>
                <p class="font-medium text-stone-900 dark:text-stone-50">
                  {{ item.title }}
                </p>
                <p class="text-xs text-stone-500 dark:text-stone-400">
                  {{ item.status }}
                  <template v-if="item.showBookingButton">
                    · {{ t('showBookingButton') }}
                  </template>
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <UiButton
                size="sm"
                variant="secondary"
                @click="startEdit(item)"
              >
                {{ t('edit') }}
              </UiButton>
              <UiButton
                size="sm"
                variant="outline"
                @click="remove(item.id)"
              >
                {{ t('delete') }}
              </UiButton>
            </div>
          </div>
          <p class="line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
            {{ item.excerpt }}
          </p>
        </li>
      </ul>
    </section>
  </div>
</template>
