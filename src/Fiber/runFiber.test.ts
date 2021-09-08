import { deepStrictEqual } from 'assert'
import * as Either from 'fp-ts/Either'
import { constant, pipe } from 'fp-ts/function'
import { describe } from 'mocha'

import { fromCbEither } from '@/Async'
import * as Cause from '@/Cause'
import { disposeNone } from '@/Disposable'
import { fromAsync, fromCause, fromEither, fromIO, fromIOEither, fromPromise } from '@/Fx'

import { runFiber } from './runFiber'

describe(__filename, () => {
  describe(runFiber.name, () => {
    describe('given the needed requirements', () => {
      describe('given a successful effect', () => {
        it('returns the expected result', async () => {
          const expected = 1
          const fx = fromIO(() => expected)
          const n = await pipe(fx, runFiber({})).exit

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
          const exit = await pipe(fx, runFiber({})).exit

          deepStrictEqual(exit, Either.left(Cause.Died(error)))
        })
      })
    })

    describe(fromCause.name, () => {
      describe('given Cause<E>', () => {
        it('exits with the given Cause', async () => {
          const causes = [
            Cause.Empty,
            Cause.Interrupted,
            Cause.Expected('Test'),
            Cause.Died(new Error('Test')),
            Cause.Then(Cause.Died(new Error('Test1')), Cause.Died(new Error('Tes2'))),
            Cause.Both(Cause.Died(new Error('Test1')), Cause.Died(new Error('Tes2'))),
          ]

          for (const cause of causes) {
            const exit = await pipe(fromCause(cause), runFiber({})).exit

            deepStrictEqual(exit, Either.left(cause))
          }
        })
      })
    })

    describe(fromEither.name, () => {
      describe('given Left<E>', () => {
        it('returns the Cause.Expected', async () => {
          const either = Either.left('foo')
          const exit = await pipe(either, fromEither, runFiber({})).exit

          deepStrictEqual(exit, Either.left(Cause.Expected((either as Either.Left<string>).left)))
        })
      })
      describe('given Right<A>', () => {
        it('is returned', async () => {
          const either = Either.right('foo')
          const exit = await pipe(either, fromEither, runFiber({})).exit

          deepStrictEqual(exit, either)
        })
      })
    })

    describe(fromAsync.name, () => {
      it('returns the result of the Async', async () => {
        const either = Either.right('foo')
        const async = fromCbEither((cb) => {
          cb(either)

          return disposeNone()
        })

        const exit = await pipe(async, fromAsync, runFiber({})).exit

        deepStrictEqual(exit, either)
      })
    })

    describe(fromIOEither.name, () => {
      it('returns the expected value', async () => {
        const either = Either.right('foo')
        const exit = await pipe(() => either, fromIOEither, runFiber({})).exit

        deepStrictEqual(exit, either)
      })
    })

    describe(fromPromise.name, () => {
      it('returns the expected value', async () => {
        const value = 1
        const exit = await pipe(fromPromise(constant(Promise.resolve(value))), runFiber({})).exit

        deepStrictEqual(exit, Either.right(value))
      })
    })
  })
})
