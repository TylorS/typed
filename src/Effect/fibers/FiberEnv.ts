import { Effect, Resume, sync } from '@typed/fp/Effect/Effect'
import { Fiber } from '@typed/fp/Effect/fibers/Fiber'
import { fromEnv } from '@typed/fp/Effect/fromEnv'
import { SchedulerEnv } from '@typed/fp/Effect/SchedulerEnv'
import { Either } from 'fp-ts/es6/Either'

/**
 * @since 0.0.1
 */
export interface FiberEnv extends SchedulerEnv {
  readonly currentFiber: Fiber<unknown>
  readonly fork: <E, A>(effect: Effect<E, A>, env: E & FiberEnv) => Resume<Fiber<A>>
  readonly join: <A>(fiber: Fiber<A>) => Resume<Either<Error, A>>
  readonly kill: <A>(fiber: Fiber<A>) => Resume<void>
}

/**
 * @since 0.0.1
 */
export const getCurrentFiber = fromEnv((e: FiberEnv) => sync(e.currentFiber))

/**
 * @since 0.0.1
 */
export const getParentFiber = fromEnv((e: FiberEnv) => sync(e.currentFiber.parentFiber))

/**
 * Creates a Fiber, a "child process" that is inherently tied to the fiber that it originates within.
 * When the parent is killed, the child process will also be killed.
 * When the parent has completed its own execution, if it still has running child processes, it will continue in a running state.
 * @since 0.0.1
 */
export const fork = <E, A>(effect: Effect<E, A>): Effect<E & FiberEnv, Fiber<A>> =>
  fromEnv((e) => e.fork(effect, e))

/**
 * Rejoin a fiber with the current process
 * @since 0.0.1
 */
export const join = <A>(fiber: Fiber<A>): Effect<FiberEnv, Either<Error, A>> =>
  fromEnv((e) => e.join(fiber))

/**
 * Kill a fiber process
 * @since 0.0.1
 */
export const kill = <A>(fiber: Fiber<A>): Effect<FiberEnv, void> => fromEnv((e) => e.kill(fiber))
