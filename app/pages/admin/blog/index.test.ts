import { describe, expect, it } from 'vitest'
import ru from './i18n/ru'

describe('admin blog page', () => {
  it('exposes i18n keys', () => {
    expect(ru.title).toBe('Блог')
    expect(ru.createTitle).toBeTruthy()
  })
})
