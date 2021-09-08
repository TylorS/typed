import { deepStrictEqual } from 'assert'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'
import { describe } from 'mocha'

import { runFiber } from '@/Fiber'
import { Fx } from '@/Fx'

import * as FiberRef from '.'

describe(__filename, () => {
  describe(FiberRef.make.name, () => {
    it('creates a FiberRef', async () => {
      const initial = 1
      const i = 2

      const test = Fx(function* () {
        const num = yield* FiberRef.make(initial)

        deepStrictEqual(num.initial, initial)

        return (yield* FiberRef.get(num)) + i
      })

      const exit = await pipe(test, runFiber({})).exit

      deepStrictEqual(exit, E.right(initial + i))
    })
  })
})
