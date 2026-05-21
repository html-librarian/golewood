export const buildExcerpt = (body: string, maxLength = 280) => {
  const normalized = body.replace(/\s+/g, ' ').trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}
