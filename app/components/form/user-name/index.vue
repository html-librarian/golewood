<script setup lang="ts">
import type { FormUserNameEmits, FormUserNameProps } from './types'

const props = defineProps<FormUserNameProps>()
const emit = defineEmits<FormUserNameEmits>()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <FormInput
      :model-value="props.lastName"
      :label="props.lastNameLabel"
      autocomplete="family-name"
      :disabled="props.disabled"
      @update:model-value="emit('update:lastName', $event)"
    />
    <FormInput
      :model-value="props.firstName"
      :label="props.firstNameLabel"
      autocomplete="given-name"
      :disabled="props.disabled"
      @update:model-value="emit('update:firstName', $event)"
    />
    <div class="space-y-1 sm:col-span-2">
      <FormInput
        :model-value="props.patronymic"
        :label="props.patronymicLabel"
        autocomplete="additional-name"
        :disabled="props.disabled"
        @update:model-value="emit('update:patronymic', $event)"
      />
      <p
        v-if="props.patronymicOptionalHint"
        class="text-xs text-stone-500 dark:text-stone-400"
      >
        {{ props.patronymicOptionalHint }}
      </p>
    </div>
  </div>
</template>
