import { deepStrictEqual, ok } from 'assert'

import { describe, it } from 'vitest'

import { MAX_UNIX_TIME } from './Time.js'

describe(import.meta.url, () => {
  describe('MAX_UNIX_TIME', () => {
    it('is the last valid date', () => {
      const max = new Date(MAX_UNIX_TIME)

      deepStrictEqual(max.getTime(), MAX_UNIX_TIME)

      ok(Number.isNaN(new Date(MAX_UNIX_TIME + 1).getTime()))
    })
  })
})
