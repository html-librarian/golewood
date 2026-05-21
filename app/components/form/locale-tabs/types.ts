export type FormLocaleTab = 'ru' | 'en'

export interface FormLocaleTabsProps {
  modelValue?: FormLocaleTab
  /** Показать * на вкладке «Русский» (обязательный контент). */
  ruRequired?: boolean
}

export interface FormLocaleTabsEmits {
  'update:modelValue': [value: FormLocaleTab]
}
