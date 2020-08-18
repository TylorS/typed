import { Scheduler } from '@most/types'
import { disposeNone } from '@typed/fp/Disposable'
import { Effect } from '@typed/fp/Effect/Effect'
import { Fiber, foldFiberInfo } from '@typed/fp/Effect/fibers/Fiber'
import { FiberEnv } from '@typed/fp/Effect/fibers/FiberEnv'
import { flow } from 'fp-ts/es6/function'

import { createFiber } from './createFiber'

/**
 * Intended for running an application using fibers. Should not be used to create individual fibers, instead
 * use `fork`.
 * @since 0.0.1
 */
export const runAsFiber = <A>(effect: Effect<FiberEnv, A>, scheduler: Scheduler): Fiber<A> =>
  createFiber(effect, scheduler)

export const runAsFiberWith = (scheduler: Scheduler) => <A>(effect: Effect<FiberEnv, A>) =>
  runAsFiber(effect, scheduler)

/**
 * Convert a fiber to a Promise of it's success/completion value.
 * @since 0.0.1
 */
export const fiberToPromise = <A>(fiber: Fiber<A>): Promise<A> =>
  new Promise((resolve, reject) => {
    fiber.onInfoChange(
      foldFiberInfo(
        disposeNone,
        disposeNone,
        flow(reject, disposeNone),
        flow(resolve, disposeNone),
        flow(resolve, disposeNone),
      ),
    )
  })
