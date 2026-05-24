import type { CompleteProfileInput } from '#shared/schemas/account-profile'
import type { UpdateHomeCityInput } from '#shared/schemas/account-home-city'
import type { User } from '#shared/types/user'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { getDb } from '../utils/db'
import { mapUser } from '../utils/auth'
import { normalizePhone } from '#shared/utils/phone'
import { toUserNameDbColumns } from '../utils/user-name'

const assertPhoneAvailable = async (phone: string, exceptUserId: string) => {
  const db = getDb()
  const normalizedPhone = normalizePhone(phone)
  const [other] = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1)

  if (other && other.id !== exceptUserId) {
    throw createError({ statusCode: 409, statusMessage: 'Phone is already used by another account' })
  }
}

export const accountProfileService = {
  completeProfile: async (userId: string, input: CompleteProfileInput): Promise<User> => {
    const db = getDb()
    const normalizedPhone = normalizePhone(input.phone)

    await assertPhoneAvailable(normalizedPhone, userId)

    const [updated] = await db.update(users)
      .set({
        ...toUserNameDbColumns(input),
        phone: normalizedPhone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    return mapUser(updated)
  },

  updateHomeCity: async (userId: string, input: UpdateHomeCityInput): Promise<User> => {
    const db = getDb()
    const homeCity = input.homeCity?.trim() || null

    const [updated] = await db.update(users)
      .set({ homeCity, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    return mapUser(updated)
  },
}
