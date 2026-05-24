// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  app: {
    head: {
      titleTemplate: '%s · Golewood',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0f766e' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Golewood' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap',
        },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  nitro: {
    preset: 'node-server',
    typescript: {
      tsConfig: {
        compilerOptions: {
          noUncheckedIndexedAccess: false,
        },
        exclude: ['../server/**/*.test.ts'],
      },
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: ['maplibre-gl'],
    },
  },

  modules: [
    '@nuxt/a11y',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
  ],

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  i18n: {
    defaultLocale: 'ru',
    locales: [
      { code: 'ru', name: 'Русский', file: 'ru.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        // Drizzle `.returning()[0]` and destructuring are safe; avoid hundreds of false positives in IDE.
        noUncheckedIndexedAccess: false,
      },
      include: [
        '../app/types/**/*.d.ts',
        '../app/**/*.test.ts',
        '../shared/**/*.test.ts',
        '../test/nuxt/**/*.test.ts',
      ],
    },
  },

  runtimeConfig: {
    databaseUrl: '',
    redisUrl: '',
    meiliHost: '',
    meiliApiKey: '',
    jwtSecret: '',
    authDevCode: '',
    uploadsDir: '',
    smsNotificationsEnabled: false,
    maxBotToken: '',
    maxWebhookSecret: '',
    maxNotificationsEnabled: false,
    smsRuApiId: '',
    smtpUrl: '',
    supportEmail: 'golewood@internet.ru',
    s3Bucket: '',
    s3Region: '',
    s3AccessKey: '',
    s3SecretKey: '',
    s3Endpoint: '',
    s3PublicUrl: '',
    yookassaShopId: '',
    yookassaSecretKey: '',
    /** Dev only: auto-activate host payout profile (set NUXT_YOOKASSA_MARKETPLACE_MOCK=true in .env) */
    yookassaMarketplaceMock: false,
    corsOrigin: '',
    rateLimitMax: '',
    rateLimitWindowSec: '',
    storyTtlHours: '24',
    storyImageDurationMs: '5000',
    oauthYandexClientId: '',
    oauthYandexClientSecret: '',
    oauthVkClientId: '',
    oauthVkClientSecret: '',
    oauthGoogleClientId: '',
    oauthGoogleClientSecret: '',
    cronSecret: '',
    calendarSyncCronEnabled: true,
    promotionIndexCronEnabled: true,
    public: {
      siteUrl: 'http://localhost:3000',
      siteName: 'Golewood',
      /** Fallback Open Graph image (absolute path on site). Use 1200×630 PNG in production. */
      defaultOgImage: '/icon-512.png',
      smsAuthEnabled: false,
      emailAuthEnabled: true,
      maxBotUsername: '',
      maxNotificationsEnabled: false,
      operatorLegalName: '',
      operatorInn: '',
      operatorKpp: '',
      operatorOgrn: '',
      operatorLegalAddress: '',
      supportEmail: 'golewood@internet.ru',
    },
  },
})
