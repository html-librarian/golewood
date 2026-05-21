<script setup lang="ts">
import type { StoryUploadEmits, StoryUploadProps } from './types'
import ru from './i18n/ru'
import en from './i18n/en'

const props = defineProps<StoryUploadProps>()
const emit = defineEmits<StoryUploadEmits>()

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { isAuthenticated, user } = useAuth()
const { uploadStory } = useStories()

const fileInputRef = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const loading = ref(false)
const error = ref('')
const success = ref(false)

const isGuest = computed(() => user.value?.role === 'guest')

const selectedFileLabel = computed(() => {
  if (!file.value) {
    return ''
  }

  return file.value.name
})

const clearPreview = () => {
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }

  previewUrl.value = null
}

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const next = input.files?.[0] ?? null

  clearPreview()
  file.value = next
  success.value = false
  error.value = ''

  if (next?.type.startsWith('image/')) {
    previewUrl.value = URL.createObjectURL(next)
  }
}

const openFilePicker = () => {
  fileInputRef.value?.click()
}

const clearFile = () => {
  clearPreview()
  file.value = null
  error.value = ''

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const submit = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(localePath('/auth/login'))
    return
  }

  if (!isGuest.value) {
    error.value = t('guestOnly')
    return
  }

  if (!file.value) {
    error.value = t('uploadError')
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    await uploadStory(props.listingId, file.value)
    clearFile()
    success.value = true
    emit('uploaded')
  } catch {
    error.value = t('uploadError')
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  clearPreview()
})
</script>

<template>
  <div class="rounded-xl border border-stone-200 bg-stone-50/80 p-4 dark:border-stone-700 dark:bg-stone-900/50">
    <p class="text-sm font-medium text-stone-800 dark:text-stone-200">
      {{ t('addStory') }}
    </p>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
      class="sr-only"
      @change="onFileChange"
    >

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <UiButton
        type="button"
        variant="outline"
        size="sm"
        @click="openFilePicker"
      >
        <Icon
          name="ph:plus-circle-duotone"
          class="mr-1.5 size-4"
        />
        {{ t('addMedia') }}
      </UiButton>

      <UiButton
        v-if="file"
        type="button"
        size="sm"
        :loading="loading"
        @click="submit"
      >
        {{ t('publish') }}
      </UiButton>

      <UiButton
        v-if="file"
        type="button"
        variant="ghost"
        size="sm"
        :disabled="loading"
        @click="clearFile"
      >
        {{ t('changeMedia') }}
      </UiButton>
    </div>

    <p class="mt-2 text-xs text-stone-500 dark:text-stone-400">
      {{ t('mediaHint') }}
    </p>

    <div
      v-if="file"
      class="mt-3 flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-2 dark:border-stone-700 dark:bg-stone-950"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt=""
        class="size-14 shrink-0 rounded-lg object-cover"
      >
      <span
        v-else
        class="flex size-14 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
        aria-hidden="true"
      >
        <Icon
          name="ph:film-strip-duotone"
          class="size-7"
        />
      </span>
      <p class="min-w-0 truncate text-sm text-stone-700 dark:text-stone-300">
        {{ selectedFileLabel }}
      </p>
    </div>

    <p
      v-if="error"
      class="mt-2 text-sm text-red-600 dark:text-red-400"
    >
      {{ error }}
    </p>
    <p
      v-else-if="success"
      class="mt-2 text-sm text-brand-700 dark:text-brand-400"
    >
      {{ t('success') }}
    </p>
  </div>
</template>
