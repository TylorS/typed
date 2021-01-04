import { disposeNone } from '@fp/Disposable/exports'
import { Effect } from '@fp/Effect/Effect'
import { Fiber, foldFiberInfo } from '@fp/Fiber/Fiber'
import { FiberEnv } from '@fp/Fiber/FiberEnv'
import { Scheduler } from '@most/types'
import { flow } from 'fp-ts/function'

import { createFiber } from './createFiber/exports'

/**
 * Intended for running an application using fibers. Should not be used to create individual fibers, instead
 * use `fork`.
 */
export const runAsFiber = <A>(effect: Effect<FiberEnv, A>, scheduler: Scheduler): Fiber<A> =>
  createFiber(effect, scheduler)

/**
 * A curried variant of runAsFiber to be used with pipe()
 */
export const runAsFiberWith = (scheduler: Scheduler) => <A>(effect: Effect<FiberEnv, A>) =>
  runAsFiber(effect, scheduler)

/**
 * Convert a fiber to a Promise of it's success/completion value.
 */
export const fiberToPromise = <A>(fiber: Fiber<A>): Promise<A> =>
  new Promise((resolve, reject) => {
    fiber.onInfoChange(
      foldFiberInfo(
        disposeNone,
        disposeNone,
        disposeNone,
        flow(reject, disposeNone),
        flow(resolve, disposeNone),
        flow(resolve, disposeNone),
      ),
    )
  })
