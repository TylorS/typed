import { deepStrictEqual, ok } from 'assert'

import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import { pipe } from 'node_modules/@fp-ts/data/Function.js'
import { describe, it } from 'vitest'

import { catchEarlyExit, earlyExit } from './earlyExit.js'

describe(import.meta.url, () => {
  describe('early exits', () => {
    it('runs fallback when exit early', async () => {
      const test = pipe(earlyExit, catchEarlyExit(Effect.sync(() => 42)))
      const result = await Effect.unsafeRunPromise(test)

      deepStrictEqual(result, 42)
    })

    it('passes along all other defects', async () => {
      const error = new Error('test')
      const test = pipe(Effect.die(error), catchEarlyExit(Effect.sync(() => 42)))
      const exit = await Effect.unsafeRunPromiseExit(test)

      ok(Exit.isFailure(exit))
      deepStrictEqual(exit.cause, Cause.die(error))
    })
  })
})
