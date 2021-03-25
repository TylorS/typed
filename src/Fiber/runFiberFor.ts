import { IdleCallbackDeadline } from '../dom'
import { doEnv, toEnv } from '../Eff'
import { ask, op } from '../Env'
import { Resume } from '../Resume'
import { SchedulerEnv } from '../Stream'
import { Fiber } from './Fiber'

export type RunFiberFor = {}

export function runFiberFor<E, A>(fiber: Fiber<E, A>, ms: number) {
  const eff = doEnv(function* (_) {
    const status = yield* fiber.status

    const { scheduler } = yield* _(ask<SchedulerEnv>())
    let didTimeout = false
    let timeRemaining = ms
    const deadline: IdleCallbackDeadline = {
      get didTimeout() {
        return didTimeout
      },
      timeRemaining: () => timeRemaining,
    }
  })

  return toEnv(eff)
}
