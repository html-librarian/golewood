export const useClickOutside = (target: Ref<HTMLElement | null>, onOutside: () => void) => {
  const handler = (event: MouseEvent) => {
    const element = target.value

    if (!element || element.contains(event.target as Node)) {
      return
    }

    onOutside()
  }

  onMounted(() => {
    document.addEventListener('click', handler, true)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handler, true)
  })
}
