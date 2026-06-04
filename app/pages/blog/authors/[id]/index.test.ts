import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('blog author page', () => {
  it('exposes i18n keys', () => {
    expect(ru.posts).toBeTruthy()
    expect(ru.notFound).toBeTruthy()
  })
})
