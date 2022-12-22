import { deepStrictEqual, ok } from 'assert'

import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import { describe, it } from 'vitest'

import { fail } from '../constructor/fail.js'
import { collectAll } from '../run/collectAll.js'

import { mapCause } from './mapCause.js'

describe(import.meta.url, () => {
  describe(mapCause.name, () => {
    it('transforms an Fx error', async () => {
      const test = pipe(fail(1), mapCause(Cause.map((x) => x + 1)), collectAll)
      const exit = await Effect.unsafeRunPromiseExit(test)

      ok(Exit.isFailure(exit))

      const option = Cause.failureOption(exit.cause)

      ok(Option.isSome(option))

      deepStrictEqual(option.value, 2)
    })
  })
})