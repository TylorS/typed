import { deepStrictEqual } from 'assert'

import { pipe } from '@fp-ts/data/Function'
import { none, some } from '@fp-ts/data/Option'
import { describe, it } from 'vitest'

import { Concurrent, Expected, Unexpected, isExpected } from './Cause.js'
import { findFirst } from './findFirst.js'

describe(import.meta.url, () => {
  describe(findFirst.name, () => {
    it('returns None if no match is made', () => {
      const result = pipe(Unexpected(new Error('unexpected')), findFirst(isExpected))

      deepStrictEqual(result, none)
    })

    it('returns Some if a match is made', () => {
      const error = new Error('expected')
      const result = pipe(Expected(error), findFirst(isExpected))

      deepStrictEqual(result, some(Expected(error)))
    })

    it('traversse Cause tree for predicate match', () => {
      const unexpected = Unexpected(new Error('unexpected'))
      const expected = Expected(new Error('expected'))
      const cause = Concurrent(unexpected, expected)

      const result = pipe(cause, findFirst(isExpected))

      deepStrictEqual(result, some(expected))
    })
  })
})
