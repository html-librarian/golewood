import { calendarSyncService } from '../../services/calendar-sync.service'
import { requireCronSecret } from '../../utils/cron-auth'

export default defineEventHandler(async (event) => {
  requireCronSecret(event)

  return await calendarSyncService.runCronSync()
})
