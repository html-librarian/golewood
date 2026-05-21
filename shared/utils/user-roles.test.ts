import { describe, expect, it } from 'vitest'
import { canAccessAdminPanel, canManageContent, canManageSupportQueue } from './user-roles'

describe('user-roles', () => {
  it('allows staff into admin panel', () => {
    expect(canAccessAdminPanel('admin')).toBe(true)
    expect(canAccessAdminPanel('support')).toBe(true)
    expect(canAccessAdminPanel('content_manager')).toBe(true)
    expect(canAccessAdminPanel('host')).toBe(false)
  })

  it('scopes support and content permissions', () => {
    expect(canManageSupportQueue('support')).toBe(true)
    expect(canManageSupportQueue('content_manager')).toBe(false)
    expect(canManageContent('content_manager')).toBe(true)
    expect(canManageContent('support')).toBe(false)
    expect(canManageContent('admin')).toBe(true)
  })
})
