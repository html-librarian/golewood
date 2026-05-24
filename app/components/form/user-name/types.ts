export interface FormUserNameProps {
  lastName: string
  firstName: string
  patronymic: string
  disabled?: boolean
  lastNameLabel: string
  firstNameLabel: string
  patronymicLabel: string
  patronymicOptionalHint?: string
}

export interface FormUserNameEmits {
  'update:lastName': [value: string]
  'update:firstName': [value: string]
  'update:patronymic': [value: string]
}
