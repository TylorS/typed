import * as Duration from '@fp-ts/data/Duration'
import * as O from '@fp-ts/data/Option'
import * as C from '@typed/clock'
import { Disposable } from '@typed/disposable'
import { Schedule, ScheduleState } from '@typed/schedule'
import { UnixTime } from '@typed/time'
import { makeTimer, Timer } from '@typed/timer'

import * as Effect from '../effect/index.js'
import { Task } from '../future/task.js'

import { callbackScheduler } from './callbackScheduler.js'

export interface Scheduler extends Timer {
  readonly delay: <R, E, A>(
    effect: Effect.Effect<R, E, A>,
    duration: Duration.Duration,
  ) => Effect.Effect<R, E, A>

  readonly schedule: <R, E, A>(
    effect: Effect.Effect<R, E, A>,
    schedule: Schedule,
  ) => Effect.Effect<R, E, ScheduleState>

  readonly fork: () => Scheduler
}

const orZero = O.getOrElse(() => Duration.zero)

type ScheduleTask = (time: UnixTime, f: () => void) => Disposable

export function Scheduler(
  timer: Timer = makeTimer(),
  scheduleTask: ScheduleTask = callbackScheduler(timer)[1],
): Scheduler {
  const delay: Scheduler['delay'] = <R, E, A>(
    effect: Effect.Effect<R, E, A>,
    duration: Duration.Duration,
  ): Effect.Effect<R, E, A> =>
    Effect.lazy(() => {
      const task = new Task<R, E, A>(effect)

      scheduleTask(C.delay(duration)(timer), task.run)

      return task.wait
    })

  const schedule: Scheduler['schedule'] = <R, E, A>(
    effect: Effect.Effect<R, E, A>,
    schedule: Schedule,
  ): Effect.Effect<R, E, ScheduleState> =>
    Effect.Effect(function* () {
      let currentTime = C.getTime(timer)
      let [state, decision] = schedule.step(ScheduleState.initial(currentTime), currentTime)

      while (decision._tag === 'Continue') {
        yield* delay(effect, orZero(decision.delay))

        currentTime = C.getTime(timer)
        ;[state, decision] = schedule.step(state, currentTime)
      }

      return state
    })

  const scheduler: Scheduler = {
    startTime: timer.startTime,
    currentTime: timer.currentTime,
    setTimer: (f, delay) => scheduleTask(C.delay(delay)(timer), () => f(C.getTime(timer))),
    delay,
    schedule,
    fork: () => Scheduler(timer.fork(), scheduleTask),
  }

  return scheduler
}
