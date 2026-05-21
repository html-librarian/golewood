import type { User } from '#shared/types/user'

declare module 'h3' {
  interface H3EventContext {
    auth?: {
      user?: User
    }
  }
}

export {}
