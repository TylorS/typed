import { Disposable, Stream } from '@most/types'
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
   * A unique ID for this specific fiber instance. By default this will be a Symbol()
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
   * Listen to status events as they occur. Events will occur with or without observation
   * and will not be replayed to late observers - use .status to get the current status at
   * any point to overcome these limitations.
   */
  readonly statusEvents: Stream<Status<A>>

  /**
   * Asynchronously cancels the underlying resources and runs any Finalizers that have been previously
   * added to this Fiber.
   */
  readonly abort: Resume<Status<A>>

  /**
   * Clone a Fiber, creating a new Fiber using the same effect and resources.
   */
  readonly clone: (options?: CloneOptions) => Resume<Fiber<A>>

  //--------------- Cooperative Scheduling ---------------//
  // In the current implementation it is not usually going to make sense to call these
  // directly yourself, but to instead use the provided pause/play functions.

  /**
   * Pause the execution of this fiber. Will return the status of the parent fiber.
   */
  readonly pause: Resume<Option<Status<unknown>>>

  /**
   * Continue executing the Fiber from a previous invocation of "pause".
   * Will throw if the Fiber is not currently paused. Returns the status of the
   * Fiber.
   */
  readonly play: Resume<Status<A>>
}

export type CloneOptions = {
  readonly inheritRefs?: boolean
  readonly parent?: Fiber<unknown>
}

/**
 * Creates a new Fiber invocation
 */
export function fork<R, A>(hkt: Env<R, A>, options?: ForkOptions): Env<Fork & R, Fiber<A>>
export function fork<R, A>(
  hkt: Env<R & CurrentFiber, A>,
  options?: ForkOptions,
): Env<Fork & R, Fiber<A>>
export function fork<R, A>(
  hkt: Env<R & SchedulerEnv, A>,
  options?: ForkOptions,
): Env<Fork & R, Fiber<A>>
export function fork<R, A>(
  hkt: Env<R & CurrentFiber & SchedulerEnv, A>,
  options?: ForkOptions,
): Env<Fork & R, Fiber<A>>

export function fork<R, A>(hkt: Env<R, A>, options: ForkOptions = {}): Env<Fork & R, Fiber<A>> {
  return (e) => e.forkFiber(hkt, e, options)
}

export type Fork = {
  readonly forkFiber: {
    <R, A>(env: Env<R, A>, requirements: R, options?: ForkOptions): Resume<Fiber<A>>
    <R, A>(env: Env<R & CurrentFiber, A>, requirements: R, options?: ForkOptions): Resume<Fiber<A>>
    <R, A>(env: Env<R & SchedulerEnv, A>, requirements: R, options?: ForkOptions): Resume<Fiber<A>>
    <R, A>(
      env: Env<R & CurrentFiber & SchedulerEnv, A>,
      requirements: R,
      options?: ForkOptions,
    ): Resume<Fiber<A>>
  }
}

export type ForkOptions = {
  readonly refs?: References
  readonly id?: PropertyKey
}

/**
 * Wait for the completion of a Fiber
 */
export const join = <A>(fiber: Fiber<A>): Env<Join, A> => ({ joinFiber }: Join) => joinFiber(fiber)

export type Join = {
  readonly joinFiber: <A>(fiber: Fiber<A>) => Resume<A>
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
export function usingFiberRefs<E, A>(env: Env<E & Refs, A>): Env<E & CurrentFiber, A> {
  return (e) =>
    env({
      ...e,
      refs: e.currentFiber.refs,
    })
}

/**
 * Run a Refs requiring Env using the references from the provided Fiber.
 */
export const withFiberRefs = (fiber: Fiber<any>) => <E, A>(env: Env<E & Refs, A>): Env<E, A> => (
  e,
) =>
  env({
    ...e,
    refs: fiber.refs,
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

export type CurrentFiber<A = any> = {
  readonly currentFiber: Fiber<A>
}
