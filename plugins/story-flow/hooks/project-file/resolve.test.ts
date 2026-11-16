import { describe, expect, test } from 'claude-code/testing'

import { candidatePaths } from './resolve'

describe('candidatePaths', () => {
  test('keeps an absolute path as given', () => {
    expect(candidatePaths('/repo/app', '/elsewhere/a.feature')).toEqual(['/elsewhere/a.feature'])
  })

  test('tries the root first, then each folder above it', () => {
    expect(candidatePaths('/repo/app', 'app/docs/a.feature')).toEqual([
      '/repo/app/app/docs/a.feature',
      '/repo/app/docs/a.feature',
      '/app/docs/a.feature',
    ])
  })
})
