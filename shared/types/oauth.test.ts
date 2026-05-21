import { describe, expect, it } from 'vitest'
import { OAUTH_PROVIDERS } from './oauth'

describe('oauth types', () => {
  it('lists supported providers', () => {
    expect(OAUTH_PROVIDERS).toEqual(['yandex', 'vk'])
  })
})
