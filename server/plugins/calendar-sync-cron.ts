import { calendarSyncService } from '../services/calendar-sync.service'

const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const STARTUP_DELAY_MS = 60_000

export default defineNitroPlugin(() => {
  if (import.meta.dev) {
    return
  }

  const config = useRuntimeConfig()

  if (String(config.calendarSyncCronEnabled) === 'false') {
    return
  }

  const run = async () => {
    try {
      const result = await calendarSyncService.runCronSync()

      if (!result.skipped) {
        console.log(`[calendar-sync] cron done: ${result.feeds ?? 0} feeds, ${result.failed ?? 0} failed`)
      }
    } catch (error) {
      console.error('[calendar-sync] cron error', error)
    }
  }

  setTimeout(() => {
    void run()
    setInterval(run, SIX_HOURS_MS)
  }, STARTUP_DELAY_MS)
})
