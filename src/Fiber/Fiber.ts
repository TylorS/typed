import { Disposable } from '@most/types'
import { Either } from 'fp-ts/Either'
import { flow } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Option } from 'fp-ts/Option'
import { Refinement } from 'fp-ts/Refinement'

import { Branded } from '../Branded'
import { asks, Env, useAll } from '../Env'
import { Resume } from '../Resume'
import { ResumeOption } from '../ResumeOption'

export type Fiber<A> = {
  readonly id: FiberId
  readonly status: IO<FiberStatus<A>>
}

export type FiberId = Branded<{ readonly FiberId: unique symbol }, PropertyKey>
export const FiberId = Branded<FiberId>()

export type FiberStatus<A> =
  | FiberQueuedStatus
  | FiberRunningStatus
  | FiberFailedStatus
  | FiberPausedStatus
  | FiberAbortedStatus
  | FiberFinishedStatus<A>
  | FiberCompletedStatus<A>

/**
 * The initial state a fiber starts before running
 */
export type FiberQueuedStatus = {
  readonly type: 'queued'
}

/**
 * The state of a fiber when it begins running its computations
 */
export type FiberRunningStatus = {
  readonly type: 'running'
}

/**
 * The state of a fiber when it has failed, but it still has uninterruptable child
 * fibers.
 */
export type FiberFailedStatus = {
  readonly type: 'failed'
  readonly error: Error
}

/**
 * The state of a fiber when it has chosen to yield to its parent
 */
export type FiberPausedStatus = {
  readonly type: 'paused'
}

/**
 * The state of a fiber when it has been aborted
 */
export type FiberAbortedStatus = {
  readonly type: 'aborted'
}

/**
 * The state of a fiber when it has computed a value, but still has child
 * fibers executing
 */
export type FiberFinishedStatus<A> = {
  readonly type: 'finished'
  readonly value: A
}

/**
 * The state of a fiber when it and all of its children have completed
 */
export type FiberCompletedStatus<A> = {
  readonly type: 'completed'
  readonly value: Either<Error, A>
}

export type FiberEvent<A> =
  | FiberQueued
  | FiberRunning
  | FiberFailed
  | FiberPaused
  | FiberFinished<A>
  | FiberAborted
  | FiberCompleted<A>

export type FiberQueued = {
  readonly type: 'queued'
  readonly fiberId: FiberId
}

export type FiberRunning = {
  readonly type: 'running'
  readonly fiberId: FiberId
  readonly parentId: Option<FiberId>
  readonly effect: Env<unknown, unknown>
}

export type FiberFailed = {
  readonly type: 'failed'
  readonly fiberId: FiberId
  readonly error: Error
}

export type FiberPaused = {
  readonly type: 'paused'
  readonly fiberId: FiberId
}

export type FiberAborted = {
  readonly type: 'aborted'
  readonly fiberId: FiberId
}

export type FiberFinished<A> = {
  readonly type: 'finished'
  readonly fiberId: FiberId
  readonly value: A
}

export type FiberCompleted<A> = {
  readonly type: 'completed'
  readonly fiberId: FiberId
  readonly value: Either<Error, A>
}

export type SendFiberEvent = {
  readonly sendFiberEvent: <A>(event: FiberEvent<A>) => Resume<void>
}

export const sendEvent = <A>(event: FiberEvent<A>): Env<SendFiberEvent, void> => (e) =>
  e.sendFiberEvent(event)

export type ListenToEvents = {
  readonly listenToFiberEvents: <A extends FiberEvent<any>>(
    refinement: Refinement<FiberEvent<any>, A>,
    onEvent: (event: A) => Env<unknown, any>,
  ) => Resume<Disposable>
}

export const listenToEvents = <A extends FiberEvent<any>, R>(
  refinement: Refinement<FiberEvent<any>, A>,
  onEvent: (event: A) => Env<R, any>,
): Env<R & ListenToEvents, Disposable> => (e) =>
  e.listenToFiberEvents(refinement, flow(onEvent, useAll(e)))

export type Fork = {
  readonly forkFiber: <R, A>(env: Env<R, A>, requirements: R) => Resume<Fiber<A>>
}

export const fork = <R, A>(hkt: Env<R, A>): Env<Fork & R, Fiber<A>> => (e: Fork & R) =>
  e.forkFiber(hkt, e)

export type Join = {
  readonly joinFiber: <A>(fiber: Fiber<A>) => Resume<A>
}

export const join = <A>(fiber: Fiber<A>): Env<Join, A> => ({ joinFiber }: Join) => joinFiber(fiber)

export type Kill = {
  readonly killFiber: <A>(fiber: Fiber<A>) => Resume<void>
}

export const kill = <A>(fiber: Fiber<A>): Env<Kill, void> => ({ killFiber }: Kill) =>
  killFiber(fiber)

export type GetParentFiber = {
  readonly getParentFiber: <A>(fiber: Fiber<A>) => ResumeOption<Fiber<unknown>>
}

export const getParent = <A>(fiber: Fiber<A>): Env<GetParentFiber, Option<Fiber<unknown>>> => (e) =>
  e.getParentFiber(fiber)

export type GetChildFibers = {
  readonly getChildFibers: <A>(fiber: Fiber<A>) => Resume<ReadonlyArray<Fiber<unknown>>>
}

export const getChildren = <A>(
  fiber: Fiber<A>,
): Env<GetChildFibers, ReadonlyArray<Fiber<unknown>>> => (e) => e.getChildFibers(fiber)

export type PauseFiber = {
  // returns the status of the parent fiber
  readonly pauseFiber: Resume<FiberStatus<unknown>>
}

export const pause: Env<PauseFiber, FiberStatus<unknown>> = (e) => e.pauseFiber

export type PlayFiber = {
  // Returns the status of the fiber
  readonly playFiber: <A>(fiber: Fiber<A>) => Resume<FiberStatus<A>>
}

export const play = <A>(fiber: Fiber<A>): Env<PlayFiber, FiberStatus<A>> => (e: PlayFiber) =>
  e.playFiber(fiber)

export type CurrentFiber = {
  readonly currentFiber: Fiber<unknown>
}

export const getCurrentFiber: Env<CurrentFiber, Fiber<unknown>> = asks(
  (e: CurrentFiber) => e.currentFiber,
)
