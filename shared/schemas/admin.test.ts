import { describe, expect, it } from 'vitest'
import { createReportSchema, updateUserRoleSchema } from './admin'

describe('createReportSchema', () => {
  it('accepts valid report', () => {
    const result = createReportSchema.parse({
      type: 'listing',
      listingId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Misleading description and photos',
    })
    expect(result.type).toBe('listing')
  })
})

describe('updateUserRoleSchema', () => {
  it('accepts all user roles', () => {
    expect(updateUserRoleSchema.parse({ role: 'guest' }).role).toBe('guest')
    expect(updateUserRoleSchema.parse({ role: 'host' }).role).toBe('host')
    expect(updateUserRoleSchema.parse({ role: 'admin' }).role).toBe('admin')
    expect(updateUserRoleSchema.parse({ role: 'support' }).role).toBe('support')
    expect(updateUserRoleSchema.parse({ role: 'content_manager' }).role).toBe('content_manager')
  })

  it('rejects invalid role', () => {
    expect(() => updateUserRoleSchema.parse({ role: 'superuser' })).toThrow()
  })
})
