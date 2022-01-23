import { deepStrictEqual, ok } from 'assert'
import { isLeft, isRight } from 'fp-ts/Either'
import { describe } from 'mocha'

import { prettyPrint } from '@/Cause'
import { fromExit } from '@/Effect'
import { result } from '@/Effect/Result'

import { ask } from './Effect'
import * as Fx from './Fx'
import { runTraceExit } from './run'

describe(__filename, () => {
  it.only('captures errors', async () => {
    const test = Fx.Fx(function* () {
      const { a } = yield* ask<{ a: number }>('a')
      const { b } = yield* ask<{ b: number }>('b')

      throw new Error('test')

      return a + b
    })

    const exit = await runTraceExit(test, { a: 1, b: 2 })

    ok(isLeft(exit))
    console.info(prettyPrint(exit.left))
  })

  it('result + fromExit are duals', async () => {
    const test = Fx.Fx(function* () {
      const a = yield* fromExit(yield* result(ask<{ a: number }>('a')))
      const b = yield* fromExit(yield* result(ask<{ b: number }>('b')))

      return { ...a, ...b }
    })

    const exit = await runTraceExit(test, { a: 1, b: 2 })

    ok(isRight(exit))
    deepStrictEqual(exit.right, { a: 1, b: 2 })
  })
})
