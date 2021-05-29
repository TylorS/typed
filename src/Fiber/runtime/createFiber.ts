import { create } from '@fp/Adapter'
import { settable } from '@fp/Disposable'
import { Env } from '@fp/Env'
import { createReferences } from '@fp/Ref'
import * as R from '@fp/Resume'
import { SchedulerEnv } from '@fp/Scheduler'
import { createCallbackTask } from '@fp/Stream'
import { asap } from '@most/scheduler'
import { Scheduler } from '@most/types'
import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

import { CloneOptions, CurrentFiber, Fiber, ForkOptions } from '../Fiber'
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

export type FiberOptions = ForkOptions & {
  readonly scheduler: Scheduler
  readonly parent?: Fiber<unknown>
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
  const disposable = settable()

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
        addDisposable(disposable),
        R.chain(() => abort(fiber, scheduler)),
        R.chain(getStatus),
      )
    },
    clone: (options: CloneOptions = {}) =>
      pipe(
        options.inheritRefs ? refs.clone : R.of(O.none),
        R.chainFirst(
          O.matchW(
            () => R.of(void 0),
            (refs) => (options.withRefs ? options.withRefs({ refs }) : R.of(void 0)),
          ),
        ),
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

  const resume = env({ currentFiber: fiber, scheduler })
  const effect = () =>
    pipe(
      fiber,
      start(sendEventRef),
      R.chain(() => (options.withRefs ? options.withRefs({ refs }) : R.of(void 0))),
      R.chain(() => resume),
      R.chain((a) => finish(fiber, a)),
      R.exec,
    )
  const onError = (error: Error) => pipe(fail(fiber, error), R.exec)

  // Schedule sync effects to run on the next tick
  if (R.isSync(resume)) {
    disposable.addDisposable(asap(createCallbackTask(effect, onError), scheduler))
  }

  if (R.isAsync(resume)) {
    disposable.addDisposable(effect())
  }

  return fiber
}
