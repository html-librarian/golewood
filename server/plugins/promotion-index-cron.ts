import { promotionService } from '../services/promotion.service'

const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const STARTUP_DELAY_MS = 90_000

export default defineNitroPlugin(() => {
  if (import.meta.dev) {
    return
  }

  const config = useRuntimeConfig()

  if (String(config.promotionIndexCronEnabled) === 'false') {
    return
  }

  const run = async () => {
    try {
      const result = await promotionService.syncMeiliPromotionFields()
      console.log(`[promotion-index] cron done: ${result.reindexed} listings`)
    } catch (error) {
      console.error('[promotion-index] cron error', error)
    }
  }

  setTimeout(() => {
    void run()
    setInterval(run, SIX_HOURS_MS)
  }, STARTUP_DELAY_MS)
})
