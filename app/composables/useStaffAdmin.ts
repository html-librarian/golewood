import type { UserRole } from '#shared/types/user'
import { canManageContent, canManageSupportQueue } from '#shared/utils/user-roles'

export const useStaffAdmin = () => {
  const { user } = useAuth()
  const role = computed(() => user.value?.role)

  const isFullAdmin = computed(() => role.value === 'admin')
  const isSupportStaff = computed(() => canManageSupportQueue(role.value))
  const isContentStaff = computed(() => canManageContent(role.value))

  const canOpenPage = (staffRoles: UserRole[]) =>
    computed(() => role.value !== undefined && staffRoles.includes(role.value))

  return {
    role,
    isFullAdmin,
    isSupportStaff,
    isContentStaff,
    canOpenPage,
  }
}
