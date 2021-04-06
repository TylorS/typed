import { asap } from '@most/scheduler'
import { constVoid, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'

import { create } from '../../Adapter'
import { undisposable } from '../../Disposable'
import { asks, chain, Env } from '../../Env'
import { doEnv, toEnv } from '../../Fx/Env'
import { createReferences } from '../../Ref'
import * as R from '../../Resume'
import { createCallbackTask, SchedulerEnv } from '../../Stream'
import { Fiber } from '../Fiber'
import { FiberId } from '../FiberId'
import { Status } from '../Status'
import { abort } from './abort'
import { fail } from './fail'
import { getFiberStatus } from './FiberStatus'
import { finish } from './finish'
import { pause } from './pause'
import { play } from './play'
import { start } from './start'

const exec = R.run(undisposable(constVoid))

export function createFiber<A>(
  resume: R.Resume<A>,
  parent: Option<Fiber<unknown>>,
): Env<SchedulerEnv, Fiber<A>> {
  const fx = doEnv(function* (_) {
    const id = FiberId(Symbol())
    const [sendEvent, statusEvents] = create<Status<A>>()
    const refs = createReferences()
    const scheduler = yield* _(asks((e: SchedulerEnv) => e.scheduler))
    const scheduledTask = asap(
      createCallbackTask(
        () =>
          pipe(
            {},
            start(fiber, sendEvent),
            R.chain(() => resume),
            R.chain((a) => pipe({}, finish(fiber, a, sendEvent))),
            exec,
          ),
        (error) => pipe({}, fail(fiber, error, sendEvent), exec),
      ),
      scheduler,
    )
    const dispose = () => pipe({}, abort(fiber, scheduledTask, sendEvent), exec)

    const currentFiber = {
      get currentFiber() {
        return fiber
      },
    }

    const status = getFiberStatus<A>()(currentFiber)

    const fiber: Fiber<A> = {
      id,
      parent,
      status,
      statusEvents,
      refs,
      dispose,
      pause: (resume) => pipe(pause(fiber, sendEvent), R.run(resume)),
      play: pipe(
        currentFiber,
        pipe(
          sendEvent,
          play,
          chain(() => () => fiber.status),
        ),
      ),
    }

    return fiber
  })

  return toEnv(fx)
}
