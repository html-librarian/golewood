<script setup lang="ts">
import type { HelpSupportFormLabels } from './types'

const props = defineProps<{
  labels: HelpSupportFormLabels
  initialName?: string
  initialEmail?: string
}>()

const name = ref(props.initialName ?? '')
const email = ref(props.initialEmail ?? '')
const contextUrl = ref('')
const message = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

watch(
  () => [props.initialName, props.initialEmail],
  ([nextName, nextEmail]) => {
    if (nextName && !name.value) {
      name.value = nextName
    }

    if (nextEmail && !email.value) {
      email.value = nextEmail
    }
  },
)

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  success.value = false

  if (message.value.trim().length < 10) {
    error.value = props.labels.validationMessage
    loading.value = false
    return
  }

  try {
    await $fetch('/api/support/contact', {
      method: 'POST',
      body: {
        name: name.value.trim(),
        email: email.value.trim(),
        message: message.value.trim(),
        contextUrl: contextUrl.value.trim() || undefined,
      },
    })
    success.value = true
    message.value = ''
    contextUrl.value = ''
  } catch {
    error.value = props.labels.error
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form
    class="surface-card space-y-4 p-6"
    data-testid="help-support-form"
    @submit.prevent="handleSubmit()"
  >
    <p
      v-if="success"
      class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
    >
      {{ labels.success }}
    </p>

    <template v-else>
      <FormInput
        v-model="name"
        :label="labels.name"
        autocomplete="name"
        required
      />
      <FormInput
        v-model="email"
        :label="labels.email"
        type="email"
        autocomplete="email"
        required
      />
      <FormInput
        v-model="contextUrl"
        :label="labels.contextUrl"
        :placeholder="labels.contextUrlHint"
        type="url"
        autocomplete="off"
      />
      <FormTextarea
        v-model="message"
        :label="labels.message"
        :rows="5"
        required
      />
      <p
        v-if="error"
        class="text-sm text-red-600 dark:text-red-400"
      >
        {{ error }}
      </p>
      <UiButton
        type="submit"
        :loading="loading"
      >
        {{ loading ? labels.submitting : labels.submit }}
      </UiButton>
    </template>
  </form>
</template>
