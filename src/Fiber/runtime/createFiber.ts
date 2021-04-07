import { create } from '@fp/Adapter'
import { Env } from '@fp/Env'
import { createReferences, References } from '@fp/Ref'
import * as R from '@fp/Resume'
import { SchedulerEnv } from '@fp/Scheduler'
import { createCallbackTask } from '@fp/Stream'
import { asap } from '@most/scheduler'
import { Scheduler } from '@most/types'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'

import { CurrentFiber, Fiber } from '../Fiber'
import { FiberId } from '../FiberId'
import { Status } from '../Status'
import { getFiberStatus } from './FiberStatus'
import { abort } from './internal/abort'
import { fail } from './internal/fail'
import { finish } from './internal/finish'
import { pause } from './internal/pause'
import { play } from './internal/play'
import { start } from './internal/start'

let fiberCount = 0

export function createFiber<A>(
  env:
    | Env<unknown, A>
    | Env<CurrentFiber, A>
    | Env<SchedulerEnv, A>
    | Env<CurrentFiber & SchedulerEnv, A>,
  parent: Option<Fiber<unknown>>,
  scheduler: Scheduler,
  refs: References = createReferences(),
): Fiber<A> {
  const id = FiberId(Symbol(`Fiber${fiberCount++}`))
  const statusEvents = create<Status<A>>()
  const scheduledTask = asap(
    createCallbackTask(
      () =>
        pipe(
          fiber,
          start,
          R.chain(() => env({ currentFiber: fiber, scheduler })),
          R.chain((a) => finish(fiber, a)),
          R.exec,
        ),
      (error) => pipe(fail(fiber, error), R.exec),
    ),
    scheduler,
  )

  const getStatus = () => pipe({ currentFiber: fiber }, getFiberStatus<A>())

  const fiber: Fiber<A> = {
    id,
    parent,
    get status() {
      return getStatus()
    },
    statusEvents,
    refs,
    pause: R.async((resume) => pipe(fiber, pause, R.run(resume))),
    get play() {
      return pipe(fiber, play, R.chain(getStatus))
    },
    get abort() {
      return pipe(abort(fiber, scheduledTask), R.chain(getStatus))
    },
  }

  return fiber
}
