import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('help become-host i18n', () => {
  it('has guide sections', () => {
    expect(ru.sections.length).toBeGreaterThan(2)
  })
})
