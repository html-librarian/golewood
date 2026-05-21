export interface ListingSectionNavItem {
  id: string
  label: string
}

export interface ListingSectionNavProps {
  items: ListingSectionNavItem[]
  activeId: string
  visible: boolean
}

export interface ListingSectionNavEmits {
  select: [id: string]
}
