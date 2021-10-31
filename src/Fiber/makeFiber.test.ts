import { deepStrictEqual } from 'assert'
import { right } from 'fp-ts/Either'

import { dateClock } from '@/Clock'
import * as Context from '@/Context'
import { runMain } from '@/Fx'
import { DefaultScheduler } from '@/Scheduler/DefaultScheduler'
import { makeLocalScope } from '@/Scope'
import { makeTimeoutTimer } from '@/Timer'

import { fromIO } from './Instruction'
import { makeRuntimeFiber } from './makeFiber'

describe(__filename, () => {
  describe(makeRuntimeFiber.name, () => {
    describe('exit', () => {
      it('returns the exit value of a Fiber', async () => {
        const value = 42
        const fx = fromIO(() => value)
        const context = Context.make({
          scheduler: new DefaultScheduler(makeTimeoutTimer(dateClock)),
        })
        const fiber = makeRuntimeFiber(fx, {
          scope: makeLocalScope({}),
          context,
        })

        const exit = await runMain(fiber.exit, context)

        deepStrictEqual(exit, right(value))
      })
    })
  })
})
