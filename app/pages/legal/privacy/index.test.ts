import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('legal privacy i18n', () => {
  it('mentions cookies', () => {
    const cookieSection = ru.sections.find(section => section.title.includes('Cookie'))
    expect(cookieSection?.paragraphs.length).toBeGreaterThan(0)
  })
})
