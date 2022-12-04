import { Tag } from '@fp-ts/data/Context'
import * as Duration from '@fp-ts/data/Duration'
import * as O from '@fp-ts/data/Option'
import * as C from '@typed/clock'
import { Disposable } from '@typed/disposable'
import { Schedule, ScheduleState } from '@typed/schedule'
import { Timer } from '@typed/timer'

import { Effect } from '../Effect/Effect.js'
import { Async, gen, Lazy } from '../Effect/Instruction.js'
import { pending } from '../Future/Future.js'

import { callbackScheduler } from './callbackScheduler.js'

export interface Scheduler extends C.Clock, Disposable {
  readonly delay: <R, E, A>(effect: Effect<R, E, A>, duration: Duration.Duration) => Effect<R, E, A>

  readonly schedule: <R, E, A>(
    effect: Effect<R, E, A>,
    schedule: Schedule,
  ) => Effect<R, E, ScheduleState>

  readonly fork: () => Scheduler
}

export const Scheduler = Object.assign(function makeScheduler(timer: Timer = Timer()): Scheduler {
  const [disposable, add] = callbackScheduler(timer)

  const delay: Scheduler['delay'] = (effect, duration) =>
    new Lazy(() => {
      const task = new Task(effect)

      add(C.delay(duration)(timer), task.start)

      return task.wait
    })

  const schedule: Scheduler['schedule'] = (effect, schedule) =>
    gen(function* () {
      const startTime = C.getTime(timer)
      let [state, decision] = schedule.step(ScheduleState.initial(startTime), startTime)

      while (decision._tag === 'Continue') {
        const currentDelay = decision.delay

        if (O.isSome(currentDelay)) {
          yield* delay(effect, currentDelay.value)
        } else {
          yield* effect
        }

        ;[state, decision] = schedule.step(state, C.getTime(timer))
      }

      return state
    })

  const scheduler: Scheduler = {
    startTime: timer.startTime,
    currentTime: timer.currentTime,
    dispose: disposable.dispose,
    delay,
    schedule,
    fork: (): Scheduler => new ForkScheduler(scheduler, timer.fork()),
  }

  return scheduler
}, Tag<Scheduler>())

class ForkScheduler implements Scheduler {
  readonly startTime: Scheduler['startTime']
  readonly currentTime: Scheduler['currentTime']
  readonly dispose: Scheduler['dispose']
  readonly delay: Scheduler['delay']
  readonly schedule: Scheduler['schedule']

  constructor(readonly scheduler: Scheduler, readonly timer: Timer) {
    this.startTime = timer.startTime
    this.currentTime = timer.currentTime
    this.dispose = scheduler.dispose
    this.delay = scheduler.delay
    this.schedule = scheduler.schedule
  }

  fork(): Scheduler {
    return new ForkScheduler(this.scheduler, this.timer.fork())
  }
}

class Task<R, E, A> {
  protected future = pending<R, E, A>()
  constructor(readonly effect: Effect<R, E, A>) {}
  readonly wait: Effect<R, E, A> = new Async(this.future)
  readonly start = () => this.future.complete(this.effect)
}
