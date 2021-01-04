import { doEffect, Effect, fromEnv, zip } from '@fp/Effect/exports'
import { Fiber } from '@fp/Fiber/Fiber'
import { Resume, sync } from '@fp/Resume/exports'
import { SchedulerEnv } from '@fp/Scheduler/exports'
import { Either } from 'fp-ts/Either'

/**
 * An environment type for managing fibers and performing simple cooperative multitasking.
 */
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

/**
 * Get the current Fiber instance.
 */
export const getCurrentFiber = fromEnv((e: FiberEnv) => sync(e.currentFiber))

/**
 * Get the parent Fiber instance.
 */
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

/**
 * Pause the current fiber allowing for cooperative multitasking with a parent Fiber.
 * @example
 *
 * const queue = []
 *
 * const foo = forever(doEffect(function*(){
 *   const item = queue.shift()
 *
 *   if (item) {
 *     // Do some work
 *   }
 *
 *   // Allow for parent fiber to decide when to proceed
 *   yield* pause
 * }))
 */
export const pause: Effect<FiberEnv, void> = fromEnv((e) => e.pause)

/**
 * Allow for a paused Fiber to continue running.
 */
export const proceed = (fiber: Fiber<unknown>): Effect<FiberEnv, void> =>
  fromEnv((e) => e.proceed(fiber))

/**
 * Allow for many paused Fibers to continue running.
 */
export const proceedAll = (...fibers: ReadonlyArray<Fiber<unknown>>): Effect<FiberEnv, void> =>
  doEffect(function* () {
    yield* zip(fibers.map(proceed))
  })

/**
 * Create a Fiber that will start in an immediately paused state to allow for the parent fiber
 * to decide when it starts doing any work.
 */
export const forkPaused = <E, A>(effect: Effect<E, A>): Effect<E & FiberEnv, Fiber<A>> => {
  const eff = doEffect(function* () {
    yield* pause

    return yield* effect
  })

  return fork(eff)
}
