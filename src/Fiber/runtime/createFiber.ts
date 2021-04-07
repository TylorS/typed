import { asap } from '@most/scheduler'
import { Scheduler } from '@most/types'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'

import { create } from '../../Adapter'
import { Env } from '../../Env'
import { createReferences, References } from '../../Ref'
import * as R from '../../Resume'
import { SchedulerEnv } from '../../Scheduler'
import { createCallbackTask } from '../../Stream'
import { CurrentFiber, Fiber } from '../Fiber'
import { FiberId } from '../FiberId'
import { Status } from '../Status'
import { abort } from './abort'
import { fail } from './fail'
import { getFiberStatus } from './FiberStatus'
import { finish } from './finish'
import { pause } from './pause'
import { play } from './play'
import { start } from './start'

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
  const id = FiberId(Symbol())
  const [sendEvent, statusEvents] = create<Status<A>>()
  const scheduledTask = asap(
    createCallbackTask(
      () =>
        pipe(
          {},
          start(fiber, sendEvent),
          R.chain(() => env({ currentFiber: fiber, scheduler })),
          R.chain((a) => pipe({}, finish(fiber, a, sendEvent))),
          R.exec,
        ),
      (error) => pipe({}, fail(fiber, error, sendEvent), R.exec),
    ),
    scheduler,
  )
  const dispose = () => pipe({}, abort(fiber, scheduledTask, sendEvent), R.exec)

  const fiber: Fiber<A> = {
    id,
    parent,
    get status() {
      return pipe({ currentFiber: fiber }, getFiberStatus<A>())
    },
    statusEvents,
    refs,
    dispose,
    pause: (resume) => pipe(pause(fiber, sendEvent), R.run(resume)),
    play: R.async((resume) =>
      pipe(
        play(fiber, sendEvent),
        R.chain(() => getFiberStatus<A>()({ currentFiber: fiber })),
        R.run(resume),
      ),
    ),
  }

  return fiber
}
