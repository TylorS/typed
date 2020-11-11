import { doEffect, Effect, fromEnv, zip } from '@typed/fp/Effect/exports'
import { Fiber } from '@typed/fp/Fiber/Fiber'
import { Resume, sync } from '@typed/fp/Resume/exports'
import { SchedulerEnv } from '@typed/fp/Scheduler/exports'
import { Either } from 'fp-ts/Either'

export interface FiberEnv extends SchedulerEnv {
  readonly currentFiber: Fiber<unknown>
  readonly fork: <E, A>(effect: Effect<E, A>, env: E & FiberEnv) => Resume<Fiber<A>>
  readonly join: <A>(fiber: Fiber<A>) => Resume<Either<Error, A>>
  readonly kill: <A>(fiber: Fiber<A>) => Resume<void>

  /* Cooperative Multitasking */
  readonly pause: Resume<void> // Only pauses if currentFiber has a parentFiber
  // Allows proceeding processing of a fiber that has paused
  // Only works if fiber is Queued/Paused and is child of current fiber
  readonly proceed: (fiber: Fiber<unknown>) => Resume<void>
}

export const getCurrentFiber = fromEnv((e: FiberEnv) => sync(e.currentFiber))

export const getParentFiber = fromEnv((e: FiberEnv) => sync(e.currentFiber.parentFiber))

/**
 * Creates a Fiber, a "child process" that is inherently tied to the fiber that it originates within.
 * When the parent is killed, the child process will also be killed.
 * When the parent has completed its own execution, if it still has running child processes, it will continue in a running state.
 */
export const fork = <E, A>(effect: Effect<E, A>): Effect<E & FiberEnv, Fiber<A>> =>
  fromEnv((e) => e.fork(effect, e))

/**
 * Rejoin a fiber with the current process
 */
export const join = <A>(fiber: Fiber<A>): Effect<FiberEnv, Either<Error, A>> =>
  fromEnv((e) => e.join(fiber))

/**
 * Kill a fiber process
 */
export const kill = <A>(fiber: Fiber<A>): Effect<FiberEnv, void> => fromEnv((e) => e.kill(fiber))

export const pause: Effect<FiberEnv, void> = fromEnv((e) => e.pause)

export const proceed = (fiber: Fiber<unknown>): Effect<FiberEnv, void> =>
  fromEnv((e) => e.proceed(fiber))

export const proceedAll = (...fibers: ReadonlyArray<Fiber<unknown>>): Effect<FiberEnv, void> =>
  doEffect(function* () {
    yield* zip(fibers.map(proceed))
  })

export const forkPaused = <E, A>(effect: Effect<E, A>): Effect<E & FiberEnv, Fiber<A>> => {
  const eff = doEffect(function* () {
    yield* pause

    return yield* effect
  })

  return fork(eff)
}
