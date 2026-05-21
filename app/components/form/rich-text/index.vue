<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import type { FormRichTextEmits, FormRichTextProps } from './types'

const props = withDefaults(defineProps<FormRichTextProps>(), {
  disabled: false,
  minHeightClass: 'min-h-48',
  required: false,
})

const emit = defineEmits<FormRichTextEmits>()
const { t } = useI18n()

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit],
  editable: !props.disabled,
  editorProps: {
    attributes: {
      class: [
        'prose prose-sm max-w-none px-3.5 py-2.5 text-stone-900 focus:outline-none dark:prose-invert dark:text-stone-100',
        props.minHeightClass,
      ].join(' '),
    },
  },
  onUpdate: ({ editor: ed }) => {
    emit('update:modelValue', ed.getHTML())
  },
})

watch(
  () => props.modelValue,
  (value) => {
    const instance = editor.value

    if (!instance || instance.getHTML() === value) {
      return
    }

    instance.commands.setContent(value || '', { emitUpdate: false })
  },
)

watch(
  () => props.disabled,
  (disabled) => {
    editor.value?.setEditable(!disabled)
  },
)

const runCommand = (command: () => boolean) => {
  if (props.disabled) {
    return
  }

  command()
}

const toolbarButtonClass = (active: boolean) => [
  'rounded-lg px-2 py-1 text-xs font-medium transition',
  active
    ? 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
    : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800',
]

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <FormField
    :id="id"
    :label="label"
    :error="error"
    :required="required"
  >
    <template #default="{ fieldId }">
      <ClientOnly>
        <div
          :id="fieldId"
          class="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
          :class="error ? 'border-red-500 dark:border-red-500' : 'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:focus-within:border-brand-400 dark:focus-within:ring-brand-400/20'"
        >
          <div
            v-if="editor"
            class="flex flex-wrap gap-1 border-b border-stone-200 px-2 py-1.5 dark:border-stone-700"
            role="toolbar"
            :aria-label="t('form.richText.toolbar')"
          >
          <button
            type="button"
            :class="toolbarButtonClass(editor.isActive('bold'))"
            :title="t('form.richText.bold')"
            @click="runCommand(() => editor!.chain().focus().toggleBold().run())"
          >
            {{ t('form.richText.bold') }}
          </button>
          <button
            type="button"
            :class="toolbarButtonClass(editor.isActive('italic'))"
            :title="t('form.richText.italic')"
            @click="runCommand(() => editor!.chain().focus().toggleItalic().run())"
          >
            {{ t('form.richText.italic') }}
          </button>
          <button
            type="button"
            :class="toolbarButtonClass(editor.isActive('heading', { level: 2 }))"
            :title="t('form.richText.heading')"
            @click="runCommand(() => editor!.chain().focus().toggleHeading({ level: 2 }).run())"
          >
            {{ t('form.richText.heading') }}
          </button>
          <button
            type="button"
            :class="toolbarButtonClass(editor.isActive('bulletList'))"
            :title="t('form.richText.bulletList')"
            @click="runCommand(() => editor!.chain().focus().toggleBulletList().run())"
          >
            {{ t('form.richText.bulletList') }}
          </button>
          <button
            type="button"
            :class="toolbarButtonClass(editor.isActive('orderedList'))"
            :title="t('form.richText.orderedList')"
            @click="runCommand(() => editor!.chain().focus().toggleOrderedList().run())"
          >
            {{ t('form.richText.orderedList') }}
          </button>
          <button
            type="button"
            :class="toolbarButtonClass(editor.isActive('blockquote'))"
            :title="t('form.richText.quote')"
            @click="runCommand(() => editor!.chain().focus().toggleBlockquote().run())"
          >
            {{ t('form.richText.quote') }}
          </button>
        </div>

          <EditorContent
            :editor="editor"
            class="[&_.ProseMirror]:outline-none"
          />
        </div>
        <template #fallback>
          <textarea
            :id="fieldId"
            :value="modelValue"
            :disabled="disabled"
            :required="required"
            :rows="6"
            class="form-input min-h-48 w-full resize-y"
            :class="{ 'form-input-error': !!error }"
            @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
          />
        </template>
      </ClientOnly>
    </template>
  </FormField>
</template>
