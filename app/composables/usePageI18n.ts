export type PageLocaleValue = string | PageLocaleSchema | readonly PageLocaleValue[]

export type PageLocaleSchema = {
  [key: string]: PageLocaleValue
}

export type PageLocaleMessages = {
  ru: PageLocaleSchema
  en: PageLocaleSchema
}

export const usePageI18n = (messages: PageLocaleMessages) =>
  useI18n({
    inheritLocale: true,
    useScope: 'local',
    messages,
  })
