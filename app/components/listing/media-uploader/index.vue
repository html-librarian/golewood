<script setup lang="ts">
import { LISTING_PHOTO_MAX_BYTES } from '#shared/utils/media-limits'
import type { ListingMediaUploaderEmits, ListingMediaUploaderProps } from './types'

const props = withDefaults(defineProps<ListingMediaUploaderProps>(), {
  loading: false,
})

const emit = defineEmits<ListingMediaUploaderEmits>()
const { t: $t } = useI18n()
const {
  uploadPhoto,
  deletePhoto,
  addVideo,
  uploadDocument,
  deleteDocument,
  reorderPhotos,
} = useListings()

const busy = ref(false)
const error = ref('')
const videoUrl = ref('')
const documentTitle = ref('')
const pendingDocumentFile = ref<File | null>(null)
const documentFileInputRef = ref<HTMLInputElement | null>(null)
const dragPhotoId = ref<string | null>(null)

const photoItems = computed(() => props.photos.filter(item => item.mediaType === 'photo'))
const videoItems = computed(() => props.photos.filter(item => item.mediaType === 'video'))

const onPhotoFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = [...(input.files ?? [])]

  if (!files.length) {
    return
  }

  busy.value = true
  error.value = ''

  try {
    let next = [...props.photos]

    for (const file of files) {
      if (file.size > LISTING_PHOTO_MAX_BYTES) {
        throw new Error($t('listingMedia.photoTooLarge'))
      }

      const photo = await uploadPhoto(props.listingId, file)
      next = [...next, photo]
    }

    emit('update:photos', next)
  } catch (err) {
    error.value = err instanceof Error ? err.message : $t('listingMedia.uploadError')
  } finally {
    busy.value = false
    input.value = ''
  }
}

const onAddVideo = async () => {
  if (!videoUrl.value.trim()) {
    return
  }

  busy.value = true
  error.value = ''

  try {
    const video = await addVideo(props.listingId, videoUrl.value.trim())
    emit('update:photos', [...props.photos, video])
    videoUrl.value = ''
  } catch {
    error.value = $t('listingMedia.videoError')
  } finally {
    busy.value = false
  }
}

const onRemovePhoto = async (photoId: string) => {
  busy.value = true
  error.value = ''

  try {
    await deletePhoto(props.listingId, photoId)
    emit('update:photos', props.photos.filter(photo => photo.id !== photoId))
  } catch {
    error.value = $t('listingMedia.uploadError')
  } finally {
    busy.value = false
  }
}

const onDocumentFilePick = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  pendingDocumentFile.value = file
  error.value = ''
}

const clearPendingDocument = () => {
  pendingDocumentFile.value = null

  if (documentFileInputRef.value) {
    documentFileInputRef.value.value = ''
  }
}

const onUploadDocument = async () => {
  const file = pendingDocumentFile.value

  if (!file) {
    return
  }

  busy.value = true
  error.value = ''

  try {
    const doc = await uploadDocument(props.listingId, file, documentTitle.value.trim() || file.name)
    emit('update:documents', [...props.documents, doc])
    documentTitle.value = ''
    clearPendingDocument()
  } catch {
    error.value = $t('listingMedia.documentError')
  } finally {
    busy.value = false
  }
}

const onRemoveDocument = async (documentId: string) => {
  busy.value = true

  try {
    await deleteDocument(props.listingId, documentId)
    emit('update:documents', props.documents.filter(doc => doc.id !== documentId))
  } finally {
    busy.value = false
  }
}

const onDropPhoto = async (targetId: string) => {
  const sourceId = dragPhotoId.value

  if (!sourceId || sourceId === targetId) {
    return
  }

  const order = photoItems.value.map(photo => photo.id)
  const from = order.indexOf(sourceId)
  const to = order.indexOf(targetId)

  if (from < 0 || to < 0) {
    return
  }

  order.splice(from, 1)
  order.splice(to, 0, sourceId)

  const videoIds = videoItems.value.map(video => video.id)
  const fullOrder = [...order, ...videoIds]

  busy.value = true

  try {
    const reordered = await reorderPhotos(props.listingId, fullOrder)
    emit('update:photos', reordered)
  } finally {
    busy.value = false
    dragPhotoId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-3">
      <p class="form-label">
        {{ $t('listingMedia.photosTitle') }}
      </p>
      <p class="text-xs text-stone-500 dark:text-stone-400">
        {{ $t('listingMedia.photosHint', { maxMb: Math.round(LISTING_PHOTO_MAX_BYTES / 1024 / 1024) }) }}
      </p>

      <label class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50/50 dark:border-stone-600 dark:bg-stone-900/50 dark:hover:border-brand-600 dark:hover:bg-brand-950/30">
        <Icon
          name="ph:images-duotone"
          class="size-8 text-stone-400 dark:text-stone-500"
        />
        <span class="text-sm font-medium text-stone-700 dark:text-stone-300">{{ $t('listingMedia.uploadPhotos') }}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          class="sr-only"
          :disabled="busy || loading"
          @change="onPhotoFiles"
        >
      </label>

      <div
        v-if="photoItems.length"
        class="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        <div
          v-for="(photo, index) in photoItems"
          :key="photo.id"
          draggable="true"
          class="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700"
          @dragstart="dragPhotoId = photo.id"
          @dragover.prevent
          @drop="onDropPhoto(photo.id)"
        >
          <img
            :src="photo.url"
            alt=""
            class="h-full w-full object-cover"
          >
          <span
            v-if="index === 0"
            class="absolute left-2 top-2 rounded-md bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold text-white"
          >
            {{ $t('listingMedia.cover') }}
          </span>
          <button
            type="button"
            class="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-stone-900/70 text-white opacity-0 transition group-hover:opacity-100"
            @click="onRemovePhoto(photo.id)"
          >
            <Icon
              name="ph:x"
              class="size-4"
            />
          </button>
        </div>
      </div>
    </div>

    <section class="space-y-3 border-t border-stone-200 pt-6 dark:border-stone-800">
      <div>
        <p class="form-label">
          {{ $t('listingMedia.videosTitle') }}
        </p>
        <p class="mt-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          {{ $t('listingMedia.videosHint') }}
        </p>
      </div>

      <form
        class="space-y-3 rounded-xl border border-stone-200/80 bg-stone-50/80 p-4 dark:border-stone-800 dark:bg-stone-900/40"
        @submit.prevent="onAddVideo()"
      >
        <FormInput
          v-model="videoUrl"
          :label="$t('listingMedia.videoLabel')"
          :placeholder="$t('listingMedia.videoPlaceholder')"
          autocomplete="off"
        />
        <UiButton
          type="submit"
          class="w-full sm:w-auto"
          :disabled="busy || loading || !videoUrl.trim()"
        >
          <Icon
            name="ph:plus-circle-duotone"
            class="mr-1.5 size-4"
          />
          {{ $t('listingMedia.addVideo') }}
        </UiButton>
      </form>

      <ul
        v-if="videoItems.length"
        class="space-y-2"
      >
        <li
          v-for="video in videoItems"
          :key="video.id"
          class="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 dark:border-stone-700 dark:bg-stone-900"
        >
          <Icon
            name="ph:play-circle-duotone"
            class="size-5 shrink-0 text-brand-600 dark:text-brand-400"
          />
          <span class="min-w-0 flex-1 truncate text-sm text-stone-700 dark:text-stone-300">{{ video.embedUrl }}</span>
          <button
            type="button"
            class="shrink-0 rounded-lg p-1.5 text-stone-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            @click="onRemovePhoto(video.id)"
          >
            <Icon
              name="ph:trash"
              class="size-4"
            />
          </button>
        </li>
      </ul>
    </section>

    <section class="space-y-3 border-t border-stone-200 pt-6 dark:border-stone-800">
      <div>
        <p class="form-label">
          {{ $t('listingMedia.documentsTitle') }}
        </p>
        <p class="mt-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          {{ $t('listingMedia.documentsHint') }}
        </p>
      </div>

      <div class="space-y-4 rounded-xl border border-stone-200/80 bg-stone-50/80 p-4 dark:border-stone-800 dark:bg-stone-900/40">
        <FormInput
          v-model="documentTitle"
          :label="$t('listingMedia.documentTitleLabel')"
          :placeholder="$t('listingMedia.documentTitlePlaceholder')"
        />

        <div class="space-y-2">
          <label
            class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-6 text-center transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-stone-600 dark:bg-stone-950 dark:hover:border-brand-600 dark:hover:bg-brand-950/30"
            :class="{ 'pointer-events-none opacity-60': busy || loading }"
          >
            <input
              ref="documentFileInputRef"
              type="file"
              accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
              class="sr-only"
              :disabled="busy || loading"
              @change="onDocumentFilePick"
            >
            <Icon
              name="ph:file-arrow-up-duotone"
              class="size-8 text-stone-400 dark:text-stone-500"
            />
            <span class="text-sm font-medium text-stone-800 dark:text-stone-200">
              {{ pendingDocumentFile ? pendingDocumentFile.name : $t('listingMedia.pickDocument') }}
            </span>
            <span class="text-xs text-stone-500 dark:text-stone-400">
              {{ pendingDocumentFile ? $t('listingMedia.changeDocument') : $t('listingMedia.pickDocumentHint') }}
            </span>
          </label>

          <p
            v-if="!pendingDocumentFile"
            class="text-center text-xs text-stone-500 dark:text-stone-400"
          >
            {{ $t('listingMedia.noDocumentSelected') }}
          </p>

          <div class="flex flex-wrap gap-2">
            <UiButton
              type="button"
              class="w-full sm:flex-1"
              :disabled="busy || loading || !pendingDocumentFile"
              :loading="busy"
              @click="onUploadDocument()"
            >
              {{ $t('listingMedia.uploadDocument') }}
            </UiButton>
            <UiButton
              v-if="pendingDocumentFile"
              type="button"
              variant="ghost"
              class="w-full sm:w-auto"
              :disabled="busy || loading"
              @click="clearPendingDocument()"
            >
              {{ $t('common.cancel') }}
            </UiButton>
          </div>
        </div>
      </div>

      <ul
        v-if="documents.length"
        class="space-y-2"
      >
        <li
          v-for="doc in documents"
          :key="doc.id"
          class="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 dark:border-stone-700 dark:bg-stone-900"
        >
          <Icon
            name="ph:file-text-duotone"
            class="size-5 shrink-0 text-brand-600 dark:text-brand-400"
          />
          <a
            :href="doc.fileUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="min-w-0 flex-1 truncate text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            {{ doc.title }}
          </a>
          <button
            type="button"
            class="shrink-0 rounded-lg p-1.5 text-stone-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            @click="onRemoveDocument(doc.id)"
          >
            <Icon
              name="ph:trash"
              class="size-4"
            />
          </button>
        </li>
      </ul>
    </section>

    <p
      v-if="error"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ error }}
    </p>
  </div>
</template>
