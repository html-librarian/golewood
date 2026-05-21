import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'a',
  'blockquote',
]

const ALLOWED_ATTR = ['href', 'target', 'rel']

export const sanitizeHtml = (dirty: string) => {
  if (!dirty.trim()) {
    return ''
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}

export const plainTextFromHtml = (html: string) => {
  if (!html.trim()) {
    return ''
  }

  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html.trim()
  }

  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).trim()
}

export const textLengthFromHtml = (html: string) => plainTextFromHtml(html).length
