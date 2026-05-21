export const isMissingRelationError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('does not exist') || message.includes('42P01')
}
