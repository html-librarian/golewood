<script setup lang="ts">
import type { BlogEditorFormModel } from '~/components/blog/editor-form/types'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth', pageTransition: false })

const { t } = usePageI18n({ ru, en })
const route = useRoute()
const localePath = useLocalePath()
const { createUserPost } = useBlog()

const saving = ref(false)

const applyCreateQuery = () => {
  const listingId = typeof route.query.listingId === 'string' ? route.query.listingId : ''
  const city = typeof route.query.city === 'string' ? route.query.city : ''

  if (listingId) {
    form.value.listingId = listingId
  }

  if (city) {
    form.value.city = city
  }
}

const form = ref<BlogEditorFormModel>({
  listingId: '',
  city: '',
  titleRu: '',
  titleEn: '',
  excerptRu: '',
  excerptEn: '',
  bodyRu: '',
  bodyEn: '',
  coverImageUrl: '',
  status: 'draft',
})

applyCreateQuery()

watch(() => route.query, () => {
  applyCreateQuery()
})

const submit = async (payload: Parameters<typeof createUserPost>[0]) => {
  saving.value = true

  try {
    const post = await createUserPost(payload)
    await navigateTo(localePath(`/blog/edit/${post.id}`))
  } finally {
    saving.value = false
  }
}

useSiteSeo({ title: t('title'), description: t('subtitle') })
</script>

<template>
  <div class="page-container max-w-3xl space-y-6">
    <UiPageHeader
      :title="t('title')"
      :subtitle="t('subtitle')"
    />

    <BlogEditorForm
      v-model="form"
      :saving="saving"
      :submit-label="t('submit')"
      @submit="submit($event)"
    />
  </div>
</template>
