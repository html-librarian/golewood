<script setup lang="ts">
import type { UserRole } from '#shared/types/user'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const { fetchUsers, updateUserRole } = useAdmin()

const roleDrafts = ref<Record<string, UserRole>>({})
const verificationOpen = ref<Record<string, boolean>>({})

const { data: users, refresh, pending } = await useAsyncData('admin-users', () => fetchUsers())

watch(users, (items) => {
  if (!items) {
    return
  }

  roleDrafts.value = Object.fromEntries(items.map(user => [user.id, user.role]))
}, { immediate: true })

const handleSave = async (userId: string) => {
  const role = roleDrafts.value[userId]

  if (!role) {
    return
  }

  await updateUserRole(userId, role)
  await refresh()
}

const toggleVerification = (userId: string) => {
  verificationOpen.value = {
    ...verificationOpen.value,
    [userId]: !verificationOpen.value[userId],
  }
}

const isHostRole = (role: UserRole) => role === 'host' || role === 'admin'
</script>

<template>
  <div class="page-container max-w-4xl">
    <h1 class="section-title mb-6">
      {{ t('title') }}
    </h1>

    <div
      v-if="pending"
      class="space-y-3"
    >
      <div
        v-for="n in 4"
        :key="n"
        class="surface-card space-y-3 p-4"
      >
        <UiSkeleton variant="title" class="w-1/3" />
        <UiSkeleton class="w-1/2" />
      </div>
    </div>

    <UiEmpty
      v-else-if="!users?.length"
      icon="ph:users-duotone"
      :title="t('empty')"
    />

    <div
      v-else
      class="space-y-3"
    >
      <article
        v-for="user in users"
        :key="user.id"
        class="surface-card p-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="font-medium text-stone-900 dark:text-stone-100">
              {{ user.name ?? $t('common.emDash') }}
            </p>
            <p class="text-sm text-stone-600 dark:text-stone-400">
              {{ t('phone') }}: {{ user.phone }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="roleDrafts[user.id]"
              class="form-input py-2 text-sm"
            >
              <option value="guest">
                {{ t('roles.guest') }}
              </option>
              <option value="host">
                {{ t('roles.host') }}
              </option>
              <option value="admin">
                {{ t('roles.admin') }}
              </option>
              <option value="support">
                {{ t('roles.support') }}
              </option>
              <option value="content_manager">
                {{ t('roles.contentManager') }}
              </option>
            </select>
            <UiButton @click="handleSave(user.id)">
              {{ t('save') }}
            </UiButton>
          </div>
        </div>

        <div
          v-if="isHostRole(roleDrafts[user.id] ?? user.role)"
          class="mt-3 border-t border-stone-200 pt-3 dark:border-stone-800"
        >
          <UiButton
            variant="ghost"
            size="sm"
            @click="toggleVerification(user.id)"
          >
            {{ $t('admin.hostVerification.showForm') }}
          </UiButton>

          <AdminHostVerificationForm
            v-if="verificationOpen[user.id]"
            :user-id="user.id"
          />
        </div>
      </article>
    </div>
  </div>
</template>
