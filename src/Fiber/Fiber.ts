import { Disposable, Stream } from '@most/types'
import { Either } from 'fp-ts/Either'
import { Option } from 'fp-ts/Option'

import { asks, Env } from '../Env'
import { Arity1 } from '../function'
import { References, Refs } from '../Ref'
import { async, Resume } from '../Resume'
import { SchedulerEnv } from '../Scheduler'
import { FiberId } from './FiberId'
import { Status } from './Status'

/**
 * A Fiber is a reference to a an asynchronous workflow which can be canceled.
 * Fiber has its own set of references
 */
export interface Fiber<A> extends Refs {
  // A unique ID for this specific fiber instance
  readonly id: FiberId
  // The Fiber's parent
  readonly parent: Option<Fiber<unknown>>
  // Retrieve the current status of this Fiber
  readonly status: Resume<Status<A>>
  // Listen to status events as the occur
  readonly statusEvents: Stream<Status<A>>

  //--------------- Cooperative Scheduling ---------------//
  // Given a callback to use when returning to this fiber (see: pause in Fiber.ts)
  // Will throw if the attempting to pause in the root fiber, or a fiber with a parent of None.
  // Will throw if the fiber is not currenting have a status of "running"
  readonly pause: (resume: Arity1<Status<unknown>, Disposable>) => Disposable
  // Continue executing Fiber from the previously provided callback using "pause".
  // Will throw if the Fiber is not currently paused.
  readonly play: Resume<Status<A>>

  readonly abort: Resume<Status<A>>
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

export type CurrentFiber<A = unknown> = {
  readonly currentFiber: Fiber<A>
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

export const pause: Env<CurrentFiber, Status<unknown>> = (e) =>
  async((r) => e.currentFiber.pause(r))
