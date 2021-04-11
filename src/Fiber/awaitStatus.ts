import { Env } from '@fp/Env'
import { pipe } from '@fp/function'
import * as R from '@fp/Resume'
import { SchedulerEnv } from '@fp/Scheduler'
import { Predicate } from 'fp-ts/Predicate'
import { Refinement } from 'fp-ts/Refinement'

import { CurrentFiber } from './Fiber'
import { Status } from './Status'

export function awaitStatus<A, B extends Status<A>>(
  refinement: Refinement<Status<A>, B>,
): Env<CurrentFiber<A> & SchedulerEnv, B>

export function awaitStatus<A>(
  predicate: Predicate<Status<A>>,
): Env<CurrentFiber<A> & SchedulerEnv, Status<A>>

export function awaitStatus<A>(
  predicate: Predicate<Status<A>>,
): Env<CurrentFiber<A> & SchedulerEnv, Status<A>> {
  return (e) =>
    pipe(
      e.currentFiber.status,
      R.chain((status) => (predicate(status) ? R.sync(() => status) : awaitStatus(predicate)(e))),
    )
}
