<script setup lang="ts">
import type { User } from '#shared/types/user'
import type { AccountHomeCityEmits, AccountHomeCityProps } from './types'

const props = defineProps<AccountHomeCityProps>()
const emit = defineEmits<AccountHomeCityEmits>()

const { user, authHeaders } = useAuth()
const { setCity } = useUserCity()

const city = ref(props.initialCity ?? '')
const saving = ref(false)
const saved = ref(false)
const error = ref('')

watch(() => props.initialCity, (value) => {
  city.value = value ?? ''
})

const save = async () => {
  saving.value = true
  saved.value = false
  error.value = ''

  try {
    const trimmed = city.value.trim()
    const updated = await $fetch<User>('/api/account/home-city', {
      method: 'PATCH',
      headers: authHeaders.value,
      body: { homeCity: trimmed || null },
    })

    user.value = updated

    if (trimmed) {
      setCity(trimmed, 'manual')
    }

    saved.value = true
    emit('saved', trimmed || null)
  } catch {
    error.value = props.errorSave
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <FormCitySelect
      v-model="city"
      :label="props.label"
    />
    <p
      v-if="props.hint"
      class="text-xs text-stone-500 dark:text-stone-400"
    >
      {{ props.hint }}
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <UiButton
        size="sm"
        :loading="saving"
        @click="save()"
      >
        {{ saved ? props.savedLabel : props.saveLabel }}
      </UiButton>
      <p
        v-if="error"
        class="text-sm text-red-600 dark:text-red-400"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>
