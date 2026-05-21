/** Node/Nitro: production deploy (not `npm run dev`). */
export const isProductionRuntime = () => process.env.NODE_ENV === 'production'

export const isDevRuntime = () => !isProductionRuntime()
