import { Effect, Resume, sync } from './Effect'
import { Either } from 'fp-ts/es6/Either'
import { fromEnv } from './fromEnv'
import { SchedulerEnv } from './SchedulerEnv'
import { Fiber } from './Fiber'

export interface FiberEnv extends SchedulerEnv {
  readonly currentFiber: Fiber<unknown>
  readonly fork: <E, A>(effect: Effect<E, A>, env: E & FiberEnv) => Resume<Fiber<A>>
  readonly join: <A>(fiber: Fiber<A>) => Resume<Either<Error, A>>
  readonly kill: <A>(fiber: Fiber<A>) => Resume<void>
}

export const getCurrentFiber = fromEnv((e: FiberEnv) => sync(e.currentFiber))
export const getParentFiber = fromEnv((e: FiberEnv) => sync(e.currentFiber.parentFiber))

/**
 * Creates a Fiber, a "child process" that is inherently tied to the fiber that it originates within.
 * When the parent is killed, the child process will also be killed.
 * When the parent has completed its own execution, if it still has running child processes, it will continue in a running state
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
