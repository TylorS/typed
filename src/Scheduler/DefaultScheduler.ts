import { Time } from '@/Clock'
import { Fiber, makeRuntimeFiber } from '@/Fiber'
import { fromAsync } from '@/Fiber/Instruction'
import { Fx } from '@/Fx'
import { fork } from '@/Scope'
import { Timer } from '@/Timer'

import { ScheduleOptions, Scheduler } from './Scheduler'

export class DefaultScheduler implements Scheduler {
  constructor(readonly timer: Timer) {}

  readonly getCurrentTime = (): Time => this.timer.getCurrentTime()

  readonly delay: Scheduler['delay'] = (fx, ms, options) => {
    const { timer } = this

    return makeRuntimeFiber(
      Fx(function* () {
        yield* fromAsync<void>((cb) => timer.delay(cb, ms))

        return yield* fx
      }),
      options,
    )
  }

  readonly periodic: Scheduler['periodic'] = <R, A>(
    fx: Fx<R, A>,
    period: Time,
    options: ScheduleOptions<R, any>,
  ): Fiber<never> => {
    const { timer } = this

    return makeRuntimeFiber(
      Fx(function* () {
        while (true) {
          yield* fx
          yield* fromAsync<void>((cb) => timer.delay(cb, period))
        }
      }),
      {
        context: options.context,
        scope: fork(options.scope),
      },
    )
  }
}
