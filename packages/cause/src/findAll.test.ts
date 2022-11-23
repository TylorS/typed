import { deepStrictEqual } from 'assert'

import { pipe } from '@fp-ts/data/Function'
import { UnixTime } from '@typed/time'
import { describe, it } from 'vitest'

import { Concurrent, Expected, Unexpected, isExpected } from './Cause.js'
import { findAll } from './findAll.js'

describe(import.meta.url, () => {
  describe(findAll.name, () => {
    it('returns empty array if no match is made', () => {
      const result = pipe(Unexpected(UnixTime(0), new Error('unexpected')), findAll(isExpected))

      deepStrictEqual(result, [])
    })

    it('returns array if a match is made', () => {
      const error = new Error('expected')
      const result = pipe(Expected(UnixTime(0), error), findAll(isExpected))

      deepStrictEqual(result, [Expected(UnixTime(0), error)])
    })

    it('traversse Cause tree for predicate match', () => {
      const expected = Expected(UnixTime(0), new Error('expected'))
      const expected2 = Expected(UnixTime(0), new Error('expected2'))
      const cause = Concurrent(expected, expected2)

      const result = pipe(cause, findAll(isExpected))

      deepStrictEqual(result, [expected, expected2])
    })
  })
})
