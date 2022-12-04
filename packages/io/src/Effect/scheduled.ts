import { Duration } from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import { Schedule, ScheduleState } from '@typed/schedule'

import { getScheduler } from '../DefaultServices/DefaultServices.js'

import { Effect } from './Effect.js'
import { flatMap } from './operators.js'

export {
  forkDaemon,
  forkDaemonWithOptions,
  getClock,
  getCurrentTime,
  getCurrentUnixTime,
  getGlobalFiberScope,
  getIdGenerator,
  getScheduler,
} from '../DefaultServices/DefaultServices.js'

export function delay(delay: Duration) {
  return <R, E, A>(effect: Effect<R, E, A>): Effect<R, E, A> =>
    pipe(
      getScheduler,
      flatMap((scheduler) => scheduler.delay(effect, delay)),
    )
}

export function scheduled(schedule: Schedule) {
  return <R, E, A>(effect: Effect<R, E, A>): Effect<R, E, ScheduleState> =>
    pipe(
      getScheduler,
      flatMap((scheduler) => scheduler.schedule(effect, schedule)),
    )
}
