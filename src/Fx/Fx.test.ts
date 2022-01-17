import { ok } from 'assert'
import { isLeft } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { describe } from 'mocha'

import { prettyPrint } from '@/Cause'
import { eagerProcessors, runMainExit } from '@/Fiber'

import * as Fx from '.'

describe.only(__filename, () => {
  it('logs helpful errors based on traces', async () => {
    const test = Fx.Fx(function* () {
      const { a } = yield* Fx.ask<{ a: number }>('a')
      const { b } = yield* Fx.ask<{ b: number }>('b')

      throw new Error('test')

      return a + b
    })

    const exit = await runMainExit(pipe(test, Fx.provideAll({ a: 1, b: 2 })), {
      processors: eagerProcessors,
    })

    ok(isLeft(exit))

    console.log(prettyPrint(exit.left))
  })
})
