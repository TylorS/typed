import { create } from '@fp/Adapter'
import { Env } from '@fp/Env'
import { createReferences, References } from '@fp/Ref'
import * as R from '@fp/Resume'
import { SchedulerEnv } from '@fp/Scheduler'
import { createCallbackTask } from '@fp/Stream'
import { asap } from '@most/scheduler'
import { ScheduledTask, Scheduler } from '@most/types'
import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

import { CloneOptions, CurrentFiber, Fiber } from '../Fiber'
import { FiberId } from '../FiberId'
import { Status } from '../Status'
import { addDisposable } from './FiberDisposable'
import { getFiberStatus } from './FiberStatus'
import { abort } from './internal/abort'
import { fail } from './internal/fail'
import { FiberSendStatus } from './internal/FiberSendEvent'
import { finish } from './internal/finish'
import { pause } from './internal/pause'
import { play } from './internal/play'
import { start } from './internal/start'

export type FiberOptions = {
  readonly scheduler: Scheduler

  readonly parent?: Fiber<unknown>
  readonly refs?: References
  readonly id?: PropertyKey
}

export function createFiber<A>(
  env:
    | Env<unknown, A>
    | Env<CurrentFiber, A>
    | Env<SchedulerEnv, A>
    | Env<CurrentFiber & SchedulerEnv, A>,
  options: FiberOptions,
): Fiber<A> {
  const { scheduler, refs = createReferences() } = options
  const parent = O.fromNullable(options.parent)
  const id = FiberId(options.id ?? Symbol(`Fiber`))
  const [sendEvent, statusEvents] = create<Status<A>>()
  const sendEventRef = FiberSendStatus<A>(sendEvent)
  const scheduledTask: ScheduledTask = asap(
    createCallbackTask(
      () =>
        pipe(
          fiber,
          start(sendEventRef),
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
      return pipe(
        { currentFiber: fiber },
        addDisposable(scheduledTask),
        R.chain(() => abort(fiber, scheduler)),
        R.chain(getStatus),
      )
    },
    clone: (options: CloneOptions = {}) =>
      pipe(
        options.inheritRefs ? refs.clone : R.of(O.none),
        R.chain((option) =>
          R.sync(() =>
            createFiber(env, {
              scheduler,
              refs: pipe(option, O.toUndefined),
              parent: pipe(
                options.parent,
                O.fromNullable,
                O.alt(() => parent),
                O.toUndefined,
              ),
            }),
          ),
        ),
      ),
  }

  return fiber
}
