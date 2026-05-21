<script setup lang="ts">
import type { HostLegalType } from '#shared/types/host-verification'
import type { AdminHostVerificationFormProps } from './types'

const props = defineProps<AdminHostVerificationFormProps>()
const { t } = useI18n({ useScope: 'global' })
const { fetchHostVerification, saveHostVerification } = useAdmin()

const loading = ref(false)
const saving = ref(false)
const isVerified = ref(props.initial?.isVerified ?? false)
const legalType = ref<HostLegalType>(props.initial?.legalType ?? 'company')
const legalName = ref(props.initial?.legalName ?? '')
const inn = ref(props.initial?.inn ?? '')
const ogrn = ref(props.initial?.ogrn ?? '')
const legalAddress = ref(props.initial?.legalAddress ?? '')
const workingHoursNote = ref(props.initial?.workingHoursNote ?? '')

const load = async () => {
  loading.value = true

  try {
    const data = await fetchHostVerification(props.userId)

    if (data) {
      isVerified.value = data.isVerified
      legalType.value = data.legalType
      legalName.value = data.legalName
      inn.value = data.inn
      ogrn.value = data.ogrn ?? ''
      legalAddress.value = data.legalAddress
      workingHoursNote.value = data.workingHoursNote
    }
  } finally {
    loading.value = false
  }
}

if (!props.initial) {
  onMounted(() => {
    load()
  })
}

const handleSave = async () => {
  saving.value = true

  try {
    await saveHostVerification(props.userId, {
      isVerified: isVerified.value,
      legalType: legalType.value,
      legalName: legalName.value.trim(),
      inn: inn.value.trim(),
      ogrn: ogrn.value.trim() || null,
      legalAddress: legalAddress.value.trim(),
      workingHoursNote: workingHoursNote.value.trim(),
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div
    class="mt-4 w-full space-y-3 rounded-xl border border-stone-200 bg-stone-50/80 p-4 dark:border-stone-700 dark:bg-stone-900/50"
    data-testid="admin-host-verification-form"
  >
    <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">
      {{ t('admin.hostVerification.verificationTitle') }}
    </p>

    <p
      v-if="loading"
      class="text-sm text-stone-500 dark:text-stone-400"
    >
      {{ t('admin.hostVerification.loading') }}
    </p>

    <template v-else>
      <label class="flex items-center gap-2 text-sm">
        <input
          v-model="isVerified"
          type="checkbox"
          class="size-4 rounded border-stone-300 text-brand-700 focus:ring-brand-500 dark:border-stone-600"
        >
        {{ t('admin.hostVerification.verified') }}
      </label>

      <FormSelect
        v-model="legalType"
        :label="t('admin.hostVerification.legalType')"
        :options="[
          { value: 'company', label: t('admin.hostVerification.legalTypes.company') },
          { value: 'individual', label: t('admin.hostVerification.legalTypes.individual') },
        ]"
      />

      <FormInput
        v-model="legalName"
        :label="t('admin.hostVerification.legalName')"
      />
      <FormInput
        v-model="inn"
        :label="t('admin.hostVerification.inn')"
      />
      <FormInput
        v-model="ogrn"
        :label="t('admin.hostVerification.ogrn')"
      />
      <FormTextarea
        v-model="legalAddress"
        :label="t('admin.hostVerification.legalAddress')"
        :rows="2"
      />
      <FormTextarea
        v-model="workingHoursNote"
        :label="t('admin.hostVerification.workingHoursNote')"
        :rows="2"
      />

      <UiButton
        size="sm"
        :loading="saving"
        @click="handleSave()"
      >
        {{ t('admin.hostVerification.saveVerification') }}
      </UiButton>
    </template>
  </div>
</template>
