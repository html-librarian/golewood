import { describe, expect, it } from 'vitest'
import { plainTextFromHtml, sanitizeHtml, textLengthFromHtml } from './sanitize-html'

describe('sanitizeHtml', () => {
  it('keeps allowed formatting tags', () => {
    const html = '<p>Hello <strong>world</strong></p><script>alert(1)</script>'

    expect(sanitizeHtml(html)).toBe('<p>Hello <strong>world</strong></p>')
  })

  it('returns plain text unchanged', () => {
    expect(sanitizeHtml('Plain line')).toBe('Plain line')
  })
})

describe('plainTextFromHtml', () => {
  it('strips tags for length checks', () => {
    expect(plainTextFromHtml('<p>Hello</p>')).toBe('Hello')
    expect(textLengthFromHtml('<p>Hello</p>')).toBe(5)
  })
})
