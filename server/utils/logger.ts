export const createLogger = (scope: string) => ({
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      level: 'info',
      scope,
      message,
      ...meta,
      ts: new Date().toISOString(),
    }))
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({
      level: 'warn',
      scope,
      message,
      ...meta,
      ts: new Date().toISOString(),
    }))
  },

  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      level: 'error',
      scope,
      message,
      ...meta,
      ts: new Date().toISOString(),
    }))
  },
})

export const logger = createLogger('app')
