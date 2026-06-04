import type { UserCreateBlogPostInput } from '#shared/schemas/blog'

export interface BlogEditorFormModel {
  listingId: string
  city: string
  titleRu: string
  titleEn: string
  excerptRu: string
  excerptEn: string
  bodyRu: string
  bodyEn: string
  coverImageUrl: string
  status: 'draft' | 'published'
}

export interface BlogEditorFormProps {
  modelValue: BlogEditorFormModel
  saving?: boolean
  submitLabel: string
}

export interface BlogEditorFormEmits {
  'update:modelValue': [value: BlogEditorFormModel]
  submit: [payload: UserCreateBlogPostInput]
}
