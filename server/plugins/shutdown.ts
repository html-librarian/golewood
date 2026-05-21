import { closeDb } from '../utils/db'
import { closeRedis } from '../utils/redis'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('close', async () => {
    await closeDb()
    await closeRedis()
  })
})
