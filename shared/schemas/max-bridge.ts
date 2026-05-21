import { z } from 'zod'

export const maxBridgeAuthSchema = z.object({
  initData: z.string().trim().min(1),
})

export const maxBridgeMockSchema = z.object({
  maxUserId: z.number().int().positive(),
})

export type MaxBridgeAuthInput = z.infer<typeof maxBridgeAuthSchema>
export type MaxBridgeMockInput = z.infer<typeof maxBridgeMockSchema>
