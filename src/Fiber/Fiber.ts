import { Either } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { isNone, Option } from 'fp-ts/Option'

import { Adapter } from '../Adapter'
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
   * Send/Receive status events
   */
  readonly statusEvents: Adapter<Status<A>>

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
  readonly pause: Resume<Status<unknown>>
  /**
   * Continue executing Fiber from the previously provided callback using "pause".
   * Will throw if the Fiber is not currently paused.
   */
  readonly play: Resume<Status<A>>
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

export type Join = {
  readonly joinFiber: <A>(fiber: Fiber<A>) => Resume<Either<Error, A>>
}

export const join = <A>(fiber: Fiber<A>): Env<Join, Either<Error, A>> => ({ joinFiber }: Join) =>
  joinFiber(fiber)

export type Kill = {
  readonly killFiber: <A>(fiber: Fiber<A>) => Resume<Status<A>>
}

export const kill = <A>(fiber: Fiber<A>): Env<Kill, Status<A>> => ({ killFiber }: Kill) =>
  killFiber(fiber)

export type CurrentFiber = {
  readonly currentFiber: Fiber<any>
}

export const getCurrentFiber: Env<CurrentFiber, Fiber<unknown>> = asks(
  (e: CurrentFiber) => e.currentFiber,
)

export const getParent: Env<CurrentFiber, Option<Fiber<unknown>>> = asks(
  (e: CurrentFiber) => e.currentFiber.parent,
)

export const withFiberRefs = <E, A>(env: Env<E & Refs, A>): Env<E & CurrentFiber, A> => (e) =>
  env({
    ...e,
    refs: e.currentFiber.refs,
  })

export const pause: Env<CurrentFiber, Status<unknown>> = (e) => e.currentFiber.pause

export const play = <A>(fiber: Fiber<A>): Env<CurrentFiber, Status<A>> => (e) =>
  pipe(
    sync(() => {
      if (isNone(fiber.parent) || fiber.parent.value.id !== e.currentFiber.id) {
        throw new Error(
          `Unable to play a non-child fiber ${fiber.id.toString()} from ${e.currentFiber.id.toString()}`,
        )
      }
    }),
    chain(() => fiber.play),
  )

export const sendStatus = <A>(status: Status<A>): Env<CurrentFiber, void> => (e) =>
  fromIO(() => e.currentFiber.statusEvents[0](status))
