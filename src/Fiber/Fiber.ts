import { Disposable, Stream } from '@most/types'
import { Either } from 'fp-ts/Either'
import { constVoid, pipe } from 'fp-ts/function'
import { isSome, Option } from 'fp-ts/Option'

import { asks, Env } from '../Env'
import { References, Refs } from '../Ref'
import { chain, fromIO, Resume, sync } from '../Resume'
import { SchedulerEnv } from '../Scheduler'
import { FiberId } from './FiberId'
import { Status } from './Status'

/**
 * A Fiber is a reference to a an asynchronous workflow which can be canceled.
 * Fiber has its own set of references for reading/writing data it needs.
 */
export interface Fiber<A> extends Refs {
  /**
   * A unique ID for this specific fiber instance
   */
  readonly id: FiberId

  /**
   * The Fiber's parent, if any
   */
  readonly parent: Option<Fiber<unknown>>

  /**
   * Retrieve the current status of this Fiber
   */
  readonly status: Resume<Status<A>>

  /**
   * Listen to status events as they occur
   */
  readonly statusEvents: Stream<Status<A>>

  /**
   * Asynchronously cancels the underlying resources and runs any Finalizers that have been previously
   * added to this Fiber.
   */
  readonly abort: Resume<Status<A>>

  //--------------- Cooperative Scheduling ---------------//
  // In the current implementation it is no usually going to make sense to call these
  // directly yourself, but to instead use the provided pause/play functions.

  /**
   * Given a callback to use when returning to this fiber (see: pause in Fiber.ts)
   * Will throw if the attempting to pause in the root fiber, or a fiber with a parent of None.
   * Will throw if the fiber is not currenting have a status of "running"
   */
  readonly pause: Resume<Option<Status<unknown>>>
  /**
   * Continue executing Fiber from the previously provided callback using "pause".
   * Will throw if the Fiber is not currently paused.
   */
  readonly play: Resume<Status<A>>
}

/**
 * Creates a new Fiber invocation
 */
export function fork<R, A>(hkt: Env<R, A>, refs?: References): Env<Fork & R, Fiber<A>>
export function fork<R, A>(
  hkt: Env<R & CurrentFiber, A>,
  refs?: References,
): Env<Fork & R, Fiber<A>>
export function fork<R, A>(
  hkt: Env<R & SchedulerEnv, A>,
  refs?: References,
): Env<Fork & R, Fiber<A>>
export function fork<R, A>(
  hkt: Env<R & CurrentFiber & SchedulerEnv, A>,
  refs?: References,
): Env<Fork & R, Fiber<A>>

export function fork<R, A>(hkt: Env<R, A>, refs?: References): Env<Fork & R, Fiber<A>> {
  return (e: Fork & R) => e.forkFiber(hkt, e, refs)
}

export type Fork = {
  readonly forkFiber: {
    <R, A>(env: Env<R, A>, requirements: R, refs?: References): Resume<Fiber<A>>
    <R, A>(env: Env<R & CurrentFiber, A>, requirements: R, refs?: References): Resume<Fiber<A>>
    <R, A>(env: Env<R & SchedulerEnv, A>, requirements: R, refs?: References): Resume<Fiber<A>>
    <R, A>(
      env: Env<R & CurrentFiber & SchedulerEnv, A>,
      requirements: R,
      refs?: References,
    ): Resume<Fiber<A>>
  }
}

/**
 * Wait for the completion of a Fiber
 */
export const join = <A>(fiber: Fiber<A>): Env<Join, Either<Error, A>> => ({ joinFiber }: Join) =>
  joinFiber(fiber)

export type Join = {
  readonly joinFiber: <A>(fiber: Fiber<A>) => Resume<Either<Error, A>>
}

/**
 * Cancel the current fiber, running any finalizers required before returning the resulting status.
 */
export const kill = <A>(fiber: Fiber<A>): Env<Kill, Status<A>> => ({ killFiber }: Kill) =>
  killFiber(fiber)

export type Kill = {
  readonly killFiber: <A>(fiber: Fiber<A>) => Resume<Status<A>>
}

/**
 * Get access the the fiber context currently running within
 */
export const getCurrentFiber: Env<CurrentFiber, Fiber<unknown>> = asks(
  (e: CurrentFiber) => e.currentFiber,
)

/**
 * Get access to the parent fiber context
 */
export const getParent: Env<CurrentFiber, Option<Fiber<unknown>>> = asks(
  (e: CurrentFiber) => e.currentFiber.parent,
)

/**
 * Run a Refs requiring Env using the references from the current Fiber.
 */
export const withFiberRefs = <E, A>(env: Env<E & Refs, A>): Env<E & CurrentFiber, A> => (e) =>
  env({
    ...e,
    refs: e.currentFiber.refs,
  })

/**
 * Pauses the current fiber. If there is no parent fiber None will be returned. If there is a parent
 * a Some of the parent's status will be returned upon playing the fiber again.
 */
export const pause: Env<CurrentFiber, Option<Status<unknown>>> = (e) => e.currentFiber.pause

/**
 * Restart a currently paused Fiber
 */
export const play = <A>(fiber: Fiber<A>): Env<CurrentFiber, Status<A>> => (e) =>
  pipe(
    sync(() => {
      if (isSome(fiber.parent) && fiber.parent.value.id !== e.currentFiber.id) {
        throw new Error(
          `Attempted to resume Fiber (${fiber.id.toString()}) from Fiber ${e.currentFiber.id.toString()} which is not the same as the parent Fiber ${fiber.parent.value.id.toString()}`,
        )
      }
    }),
    chain(() => fiber.play),
  )

/**
 * Create a listener for status event changes.
 */
export const listenToStatusEvents = <A>(
  f: (status: Status<A>) => void,
): Env<CurrentFiber & SchedulerEnv, Disposable> => (e) =>
  fromIO(() =>
    e.currentFiber.statusEvents.run(
      { event: (_, s) => f(s), error: constVoid, end: constVoid },
      e.scheduler,
    ),
  )

export type CurrentFiber = {
  readonly currentFiber: Fiber<any>
}
