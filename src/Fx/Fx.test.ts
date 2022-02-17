import { deepStrictEqual, ok } from 'assert'
import { describe } from 'mocha'

import { prettyPrint } from '@/Cause'
import { fromExit, fromLazy } from '@/Effect'
import { result } from '@/Effect/Result'
import { isLeft, isRight } from '@/Prelude/Either'

import { ask } from './Effect'
import * as Fx from './Fx'
import { runMain, runTraceExit } from './run'

describe(__filename, () => {
  it('captures errors', async () => {
    const test = Fx.Fx(function* () {
      const { a } = yield* ask<{ a: number }>('a')
      const { b } = yield* ask<{ b: number }>('b')

      throw new Error('test')

      return a + b
    })

    const exit = await runTraceExit(test, { a: 1, b: 2 })

    ok(isLeft(exit))
    console.info(prettyPrint(exit.value))
  })

  it('result + fromExit are duals', async () => {
    const test = Fx.Fx(function* () {
      const a = yield* fromExit(yield* result(ask<{ a: number }>('a')))
      const b = yield* fromExit(yield* result(ask<{ b: number }>('b')))

      return { ...a, ...b }
    })

    const exit = await runTraceExit(test, { a: 1, b: 2 })

    ok(isRight(exit))
    deepStrictEqual(exit.value, { a: 1, b: 2 })
  })

  it('allows utilizing try/catch', async () => {
    const error = new Error('test')
    // eslint-disable-next-line require-yield
    const test = Fx.Fx(function* () {
      try {
        return yield* Fx.Fx(function* () {
          return yield* fromLazy(() => {
            throw error

            return 1
          })
        })
      } catch (e) {
        ok(error === e)

        return 2
      }
    })

    deepStrictEqual(await runMain(test), 2)
  })
})
