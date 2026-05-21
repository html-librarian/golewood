import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('help create-listing i18n', () => {
  it('has wizard steps', () => {
    expect(ru.steps).toHaveLength(4)
  })
})
