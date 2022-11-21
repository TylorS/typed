import { deepStrictEqual } from 'assert'

import { pipe } from '@fp-ts/data/Function'
import { some } from '@fp-ts/data/Option'
import { UnixTime } from '@typed/time'
import { describe, it } from 'vitest'

import { Concurrent, Expected, Unexpected, isExpected } from './Cause.js'
import { findFirst } from './findFirst.js'

describe(import.meta.url, () => {
  describe(findFirst.name, () => {
    it('traversse Cause tree for predicate match', () => {
      const unexpected = Unexpected(UnixTime(0), new Error('unexpected'))
      const expected = Expected(UnixTime(0), new Error('expected'))
      const cause = Concurrent(unexpected, expected)

      const result = pipe(cause, findFirst(isExpected))

      deepStrictEqual(result, some(expected))
    })
  })
})
