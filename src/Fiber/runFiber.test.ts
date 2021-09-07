import { deepStrictEqual } from 'assert'
import * as Either from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import { describe } from 'mocha'

import * as Cause from '@/Cause'
import { fromIO } from '@/Fx'

import { runFiber } from './runFiber'

describe(__filename, () => {
  describe(runFiber.name, () => {
    describe('given the needed requirements', () => {
      describe('given a successful effect', () => {
        it('returns the expected result', async () => {
          const expected = 1
          const fx = fromIO(() => expected)
          const fiber = await pipe(fx, runFiber({}))

          const n = await fiber.await

          deepStrictEqual(n, Either.right(expected))
        })
      })

      describe('given a failing effect', () => {
        it('returns the expected result', async () => {
          const error = new Error('foo')
          const fx = fromIO(() => {
            throw error
            // eslint-disable-next-line no-unreachable
            return 1
          })
          const fiber = await pipe(fx, runFiber({}))

          deepStrictEqual(await fiber.await, Either.left(Cause.Died(error)))
        })
      })
    })
  })
})
