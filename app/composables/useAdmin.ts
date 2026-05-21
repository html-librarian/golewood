import type { AdminHostPayoutQueueItem, HostPayoutProfile } from '#shared/types/host-payout'
import type { AdminHostPayoutDecisionInput } from '#shared/schemas/host-payout'
import type { HostLegalProfileAdmin } from '#shared/types/host-verification'
import { authorizationHeaders } from '#shared/utils/auth-headers'
import type { UpsertHostVerificationInput } from '#shared/schemas/host-verification'
import type { User, UserRole } from '#shared/types/user'
import type { AdminDashboardStats } from '#shared/types/admin'
import type { ReportWithDetails } from '#shared/types/report'
import type { SupportRequest } from '#shared/types/support-request'

export const useAdmin = () => {
  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchUsers = () =>
    $fetch<User[]>('/api/admin/users', { headers: authHeaders() })

  const updateUserRole = (userId: string, role: UserRole) =>
    $fetch<User>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: { role },
    })

  const fetchHostVerification = (userId: string) =>
    $fetch<HostLegalProfileAdmin | null>(`/api/admin/users/${userId}/host-verification`, {
      headers: authHeaders(),
    })

  const saveHostVerification = (userId: string, body: UpsertHostVerificationInput) =>
    $fetch<HostLegalProfileAdmin>(`/api/admin/users/${userId}/host-verification`, {
      method: 'PATCH',
      headers: authHeaders(),
      body,
    })

  const fetchReports = () =>
    $fetch<ReportWithDetails[]>('/api/admin/reports', { headers: authHeaders() })

  const fetchDashboard = () =>
    $fetch<AdminDashboardStats>('/api/admin/stats', { headers: authHeaders() })

  /** @deprecated */
  const fetchStats = fetchDashboard

  const fetchPendingHostPayouts = () =>
    $fetch<AdminHostPayoutQueueItem[]>('/api/admin/host-payouts', { headers: authHeaders() })

  const decideHostPayout = (userId: string, body: AdminHostPayoutDecisionInput) =>
    $fetch<HostPayoutProfile>(`/api/admin/host-payouts/${userId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body,
    })

  const updateReportStatus = (
    reportId: string,
    status: 'in_progress' | 'resolved' | 'dismissed',
    adminNote?: string,
  ) =>
    $fetch(`/api/admin/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: { status, adminNote },
    })

  const fetchSupportRequests = () =>
    $fetch<SupportRequest[]>('/api/admin/support-requests', { headers: authHeaders() })

  const updateSupportRequestStatus = (
    requestId: string,
    status: 'in_progress' | 'resolved' | 'dismissed',
    staffNote?: string,
  ) =>
    $fetch(`/api/admin/support-requests/${requestId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: { status, staffNote },
    })

  return {
    fetchUsers,
    updateUserRole,
    fetchHostVerification,
    saveHostVerification,
    fetchReports,
    fetchDashboard,
    fetchStats,
    fetchPendingHostPayouts,
    decideHostPayout,
    updateReportStatus,
    fetchSupportRequests,
    updateSupportRequestStatus,
  }
}
