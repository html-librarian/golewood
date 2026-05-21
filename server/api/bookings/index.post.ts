import { createBookingSchema } from '#shared/schemas/booking'
import { requireAuth } from '../../utils/auth'
import { bookingService } from '../../services/booking.service'
import { getIdempotentResponse, saveIdempotentResponse } from '../../utils/idempotency'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const idempotencyKey = getHeader(event, 'idempotency-key')

  if (idempotencyKey) {
    try {
      const cached = await getIdempotentResponse<Awaited<ReturnType<typeof bookingService.create>>>(idempotencyKey)

      if (cached) {
        return cached
      }
    } catch {
      // Redis unavailable — proceed without idempotency cache
    }
  }

  const body = await readBody(event)
  const input = createBookingSchema.parse(body)
  const booking = await bookingService.create(user.id, input)

  if (idempotencyKey) {
    try {
      await saveIdempotentResponse(idempotencyKey, booking)
    } catch {
      // Redis unavailable — response already created
    }
  }

  setResponseStatus(event, 201)

  return booking
})
