import * as Duration from '@fp-ts/data/Duration'
import * as O from '@fp-ts/data/Option'
import * as C from '@typed/clock'
import { Disposable } from '@typed/disposable'
import { Schedule, ScheduleState } from '@typed/schedule'
import { makeTimer, Timer } from '@typed/timer'

import * as Effect from '../effect/index.js'
import { Task } from '../future/task.js'

import { callbackScheduler } from './callbackScheduler.js'

export interface Scheduler extends C.Clock, Disposable {
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

export function Scheduler(timer: Timer = makeTimer()): Scheduler {
  const [disposable, add] = callbackScheduler(timer)

  const delay: Scheduler['delay'] = <R, E, A>(
    effect: Effect.Effect<R, E, A>,
    duration: Duration.Duration,
  ): Effect.Effect<R, E, A> =>
    Effect.lazy(() => {
      const task = new Task<R, E, A>(effect)

      add(C.delay(duration)(timer), task.run)

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
    delay,
    schedule,
    dispose: disposable.dispose,
    fork: () => ForkScheduler(scheduler, timer.fork()),
  }

  return scheduler
}

function ForkScheduler(scheduler: Scheduler, timer: Timer): Scheduler {
  const forked: Scheduler = {
    startTime: timer.startTime,
    currentTime: timer.currentTime,
    delay: scheduler.delay,
    schedule: scheduler.schedule,
    dispose: scheduler.dispose,
    fork: () => ForkScheduler(forked, timer.fork()),
  }

  return forked
}
