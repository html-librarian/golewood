/** Client: true only in dev build (`nuxt dev`). Always false in production bundle. */
export const useDevRuntime = () => computed(() => import.meta.dev)
