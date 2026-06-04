<script setup lang="ts">
import type { BlogEditorFormModel } from '~/components/blog/editor-form/types'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth', pageTransition: false })

const { t } = usePageI18n({ ru, en })
const route = useRoute()
const localePath = useLocalePath()
const { fetchMyPost, updateUserPost } = useBlog()

const postId = computed(() => String(route.params.id))
const saving = ref(false)
const saved = ref(false)

const { data: post, error, refresh } = await useAsyncData(
  () => `blog-edit-${postId.value}`,
  () => fetchMyPost(postId.value),
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: t('notFound') })
}

const form = ref<BlogEditorFormModel>({
  listingId: post.value?.listingId ?? '',
  city: post.value?.city ?? '',
  titleRu: post.value?.titleRu ?? '',
  titleEn: post.value?.titleEn ?? '',
  excerptRu: post.value?.excerptRu ?? '',
  excerptEn: post.value?.excerptEn ?? '',
  bodyRu: post.value?.bodyRu ?? '',
  bodyEn: post.value?.bodyEn ?? '',
  coverImageUrl: post.value?.coverImageUrl ?? '',
  status: post.value?.status ?? 'draft',
})

watch(post, (value) => {
  if (!value) {
    return
  }

  form.value = {
    listingId: value.listingId ?? '',
    city: value.city ?? '',
    titleRu: value.titleRu,
    titleEn: value.titleEn,
    excerptRu: value.excerptRu,
    excerptEn: value.excerptEn,
    bodyRu: value.bodyRu,
    bodyEn: value.bodyEn,
    coverImageUrl: value.coverImageUrl ?? '',
    status: value.status,
  }
})

const submit = async (payload: Parameters<typeof updateUserPost>[1]) => {
  saving.value = true
  saved.value = false

  try {
    await updateUserPost(postId.value, payload)
    saved.value = true
    await refresh()
  } finally {
    saving.value = false
  }
}

useSiteSeo({ title: t('title'), description: t('subtitle') })
</script>

<template>
  <div
    v-if="post"
    class="page-container max-w-3xl space-y-6"
  >
    <UiPageHeader
      :title="t('title')"
      :subtitle="t('subtitle')"
    />

    <p
      v-if="saved"
      class="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-100"
    >
      {{ t('saved') }}
      <NuxtLink
        v-if="post.status === 'published'"
        :to="localePath(`/blog/${post.slug}`)"
        class="ml-2 font-medium underline"
      >
        {{ t('openPublished') }}
      </NuxtLink>
    </p>

    <BlogEditorForm
      v-model="form"
      :saving="saving"
      :submit-label="t('submit')"
      @submit="submit($event)"
    />
  </div>
</template>
