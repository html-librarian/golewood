import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

const sharedDir = fileURLToPath(new URL('./shared', import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^#shared\/(.*)$/, replacement: `${sharedDir}/$1` },
      { find: '#shared', replacement: sharedDir },
    ],
  },
  test: {
    projects: [
      {
        resolve: {
          alias: [
            { find: /^#shared\/(.*)$/, replacement: `${sharedDir}/$1` },
            { find: '#shared', replacement: sharedDir },
          ],
        },
        test: {
          name: 'unit',
          include: ['app/**/*.test.ts', 'shared/**/*.test.ts', 'server/**/*.test.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.test.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
