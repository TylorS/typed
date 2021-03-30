import { Either } from 'fp-ts/Either'
import { FromEnv, FromEnv2, FromEnv3, FromEnv4 } from './FromEnv'
import { Branded } from './Branded'
import { Hkt } from './Hkt'
import { Resume } from './Resume'
import { HKT2, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import { ResumeOption } from './ResumeOption'
import { Option } from 'fp-ts/Option'
import { Refinement } from 'fp-ts/Refinement'
import { Disposable } from '@most/types'
import { UseAll, UseAll2, UseAll3, UseAll4 } from './Provide'

export interface Fiber<F, A> {
  readonly id: FiberId
  readonly status: HKT2<F, never, FiberStatus<A>>
}

export interface Fiber2<F extends URIS2, A> {
  readonly id: FiberId
  readonly status: Hkt<F, [never, FiberStatus<A>]>
}

export interface Fiber3<F extends URIS3, E, A> {
  readonly id: FiberId
  readonly status: Hkt<F, [never, E, FiberStatus<A>]>
}

export interface Fiber4<F extends URIS4, S, E, A> {
  readonly id: FiberId
  readonly status: Hkt<F, [S, never, E, FiberStatus<A>]>
}

export type FiberId = Branded<{ readonly FiberId: unique symbol }, PropertyKey>

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

export type FiberEvent<F, A> =
  | FiberQueued
  | FiberRunning<F>
  | FiberFailed
  | FiberPaused
  | FiberAborted
  | FiberFinished<A>
  | FiberCompleted<A>

export type FiberQueued = {
  readonly type: 'queued'
  readonly fiberId: FiberId
}

export type FiberRunning<F> = {
  readonly type: 'running'
  readonly fiberId: FiberId
  readonly effect: Hkt<F, readonly unknown[]>
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

export type SendFiberEvent<F> = {
  readonly sendFiberEvent: <A>(event: FiberEvent<F, A>) => Resume<void>
}

export function sendEvent<F extends URIS2>(
  M: FromEnv2<F>,
): <A>(event: FiberEvent<F, A>) => Hkt<F, [SendFiberEvent<F>, void]>

export function sendEvent<F extends URIS3>(
  M: FromEnv3<F>,
): <E, A>(event: FiberEvent<F, A>) => Hkt<F, [SendFiberEvent<F>, E, void]>

export function sendEvent<F extends URIS4>(
  M: FromEnv4<F>,
): <S, E, A>(event: FiberEvent<F, A>) => Hkt<F, [S, SendFiberEvent<F>, E, void]>

export function sendEvent<F>(
  M: FromEnv<F>,
): <A>(event: FiberEvent<F, A>) => Hkt<F, [SendFiberEvent<F>, void]>

export function sendEvent<F>(M: FromEnv<F>) {
  return <A>(event: FiberEvent<F, A>) =>
    M.fromEnv(({ sendFiberEvent }: SendFiberEvent<F>) => sendFiberEvent(event))
}

export type ListenToEvents<F> = {
  readonly listenToFiberEvents: <A extends FiberEvent<F, any>>(
    refinement: Refinement<FiberEvent<F, any>, A>,
    onEvent: (event: A) => HKT2<F, never, any>,
  ) => Resume<Disposable>
}

export type ListenToEvents2<F extends URIS2> = {
  readonly listenToFiberEvents: <A extends FiberEvent<F, any>>(
    refinement: Refinement<FiberEvent<F, any>, A>,
    onEvent: (event: A) => Hkt<F, [never, any]>,
  ) => Resume<Disposable>
}

export type ListenToEvents3<F extends URIS3> = {
  readonly listenToFiberEvents: <A extends FiberEvent<F, any>, E>(
    refinement: Refinement<FiberEvent<F, any>, A>,
    onEvent: (event: A) => Hkt<F, [never, E, any]>,
  ) => Resume<Disposable>
}

export type ListenToEvents4<F extends URIS4> = {
  readonly listenToFiberEvents: <A extends FiberEvent<F, any>, S, E>(
    refinement: Refinement<FiberEvent<F, any>, A>,
    onEvent: (event: A) => Hkt<F, [S, never, E, any]>,
  ) => Resume<Disposable>
}

export function listenToEvents<F extends URIS2>(
  M: FromEnv2<F> & UseAll2<F>,
): <A extends FiberEvent<F, any>, R>(
  refinement: Refinement<FiberEvent<F, any>, A>,
  onEvent: (event: A) => Hkt<F, [R, any]>,
) => Hkt<F, [R & ListenToEvents2<F>, Disposable]>
export function listenToEvents<F extends URIS3>(
  M: FromEnv3<F> & UseAll3<F>,
): <A extends FiberEvent<F, any>, R, E>(
  refinement: Refinement<FiberEvent<F, any>, A>,
  onEvent: (event: A) => Hkt<F, [R, E, any]>,
) => Hkt<F, [R & ListenToEvents3<F>, E, Disposable]>
export function listenToEvents<F extends URIS4>(
  M: FromEnv4<F> & UseAll4<F>,
): <A extends FiberEvent<F, any>, S, R, E>(
  refinement: Refinement<FiberEvent<F, any>, A>,
  onEvent: (event: A) => Hkt<F, [S, R, E, any]>,
) => Hkt<F, [S, R & ListenToEvents3<F>, E, Disposable]>
export function listenToEvents<F>(
  M: FromEnv<F> & UseAll<F>,
): <A extends FiberEvent<F, any>, R>(
  refinement: Refinement<FiberEvent<F, any>, A>,
  onEvent: (event: A) => HKT2<F, R, any>,
) => HKT2<F, R & ListenToEvents<F>, Disposable>
export function listenToEvents<F>(M: FromEnv<F> & UseAll<F>) {
  return <A extends FiberEvent<F, any>, R>(
    refinement: Refinement<FiberEvent<F, any>, A>,
    onEvent: (event: A) => HKT2<F, R, any>,
  ): HKT2<F, R & ListenToEvents<F>, Disposable> =>
    M.fromEnv((e) => e.listenToFiberEvents(refinement, (ev) => M.useAll(e as R)(onEvent(ev))))
}

export type Fork<F> = {
  readonly forkFiber: <R, A>(hkt: Hkt<F, [R, A]>, requirements: R) => Resume<Fiber<F, A>>
}

export type Fork2<F extends URIS2> = {
  readonly forkFiber: <R, A>(hkt: Hkt<F, [R, A]>, requirements: R) => Resume<Fiber2<F, A>>
}

export type Fork3<F extends URIS3> = {
  readonly forkFiber: <R, E, A>(hkt: Hkt<F, [R, E, A]>, requirements: R) => Resume<Fiber3<F, E, A>>
}

export type Fork3C<F extends URIS3, E> = {
  readonly forkFiber: <R, A>(hkt: Hkt<F, [R, E, A]>, requirements: R) => Resume<Fiber3<F, E, A>>
}

export type Fork4<F extends URIS4> = {
  readonly forkFiber: <S, R, E, A>(
    hkt: Hkt<F, [S, R, E, A]>,
    requirements: R,
  ) => Resume<Fiber4<F, S, E, A>>
}

export function fork<F extends URIS2>(
  M: FromEnv2<F>,
): <R, A>(hkt: Hkt<F, [R, A]>) => Hkt<F, [R & Fork2<F>, Fiber<F, A>]>
export function fork<F extends URIS3>(
  M: FromEnv3<F>,
): <R, E, A>(hkt: Hkt<F, [R, E, A]>) => Hkt<F, [R & Fork3<F>, E, Fiber<F, A>]>
export function fork<F extends URIS4>(
  M: FromEnv4<F>,
): <S, R, E, A>(hkt: Hkt<F, [S, R, E, A]>) => Hkt<F, [S, R & Fork4<F>, E, Fiber<F, A>]>
export function fork<F>(
  M: FromEnv<F>,
): <R, A>(hkt: Hkt<F, [R, A]>) => Hkt<F, [R & Fork<F>, Fiber<F, A>]>
export function fork<F>(M: FromEnv<F>) {
  return <R, A>(hkt: Hkt<F, [R, A]>) => M.fromEnv((e: Fork<F> & R) => e.forkFiber(hkt, e))
}

export type Join<F> = {
  readonly joinFiber: <A>(fiber: Fiber<F, A>) => Resume<A>
}

export type Join2<F extends URIS2> = {
  readonly joinFiber: <A>(fiber: Fiber2<F, A>) => Resume<A>
}

export type Join3<F extends URIS3> = {
  readonly joinFiber: <E, A>(fiber: Fiber3<F, E, A>) => Resume<A>
}

export type Join4<F extends URIS4> = {
  readonly joinFiber: <S, E, A>(fiber: Fiber4<F, S, E, A>) => Resume<A>
}

export function join<F extends URIS2>(
  M: FromEnv2<F>,
): <A>(fiber: Fiber<F, A>) => Hkt<F, [Join2<F>, A]>
export function join<F extends URIS3>(
  M: FromEnv3<F>,
): <A, E>(fiber: Fiber<F, A>) => Hkt<F, [Join3<F>, E, A]>
export function join<F extends URIS4>(
  M: FromEnv4<F>,
): <A, S, E>(fiber: Fiber<F, A>) => Hkt<F, [S, Join4<F>, E, A]>
export function join<F>(M: FromEnv<F>): <A>(fiber: Fiber<F, A>) => Hkt<F, [Join<F>, A]>
export function join<F>(M: FromEnv<F>) {
  return <A>(fiber: Fiber<F, A>) => M.fromEnv(({ joinFiber: join }: Join<F>) => join(fiber))
}

export type Kill<F> = {
  readonly killFiber: <A>(fiber: Fiber<F, A>) => Resume<void>
}

export type Kill2<F extends URIS2> = {
  readonly killFiber: <A>(fiber: Fiber2<F, A>) => Resume<void>
}

export type Kill3<F extends URIS3> = {
  readonly killFiber: <E, A>(fiber: Fiber3<F, E, A>) => Resume<void>
}

export type Kill4<F extends URIS4> = {
  readonly killFiber: <S, E, A>(fiber: Fiber4<F, S, E, A>) => Resume<void>
}

export function kill<F extends URIS2>(
  M: FromEnv2<F>,
): <A>(fiber: Fiber<F, A>) => Hkt<F, [Kill2<F>, A]>
export function kill<F extends URIS3>(
  M: FromEnv3<F>,
): <A, E>(fiber: Fiber<F, A>) => Hkt<F, [Kill3<F>, E, A]>
export function kill<F extends URIS4>(
  M: FromEnv4<F>,
): <A, S, E>(fiber: Fiber<F, A>) => Hkt<F, [S, Kill4<F>, E, A]>
export function kill<F>(M: FromEnv<F>): <A>(fiber: Fiber<F, A>) => Hkt<F, [Kill<F>, A]>
export function kill<F>(M: FromEnv<F>) {
  return <A>(fiber: Fiber<F, A>) => M.fromEnv(({ killFiber: kill }: Kill<F>) => kill(fiber))
}

export type GetParentFiber<F> = {
  readonly getParentFiber: <A>(fiber: Fiber<F, A>) => ResumeOption<Fiber<F, unknown>>
}

export type GetParentFiber2<F extends URIS2> = {
  readonly getParentFiber: <A>(fiber: Fiber2<F, A>) => ResumeOption<Fiber2<F, unknown>>
}

export type GetParentFiber3<F extends URIS3> = {
  readonly getParentFiber: <E, A>(fiber: Fiber3<F, E, A>) => ResumeOption<Fiber3<F, E, unknown>>
}

export type GetParentFiber4<F extends URIS4> = {
  readonly getParentFiber: <S, E, A>(
    fiber: Fiber4<F, S, E, A>,
  ) => ResumeOption<Fiber4<F, S, E, unknown>>
}

export function getParent<F extends URIS2>(
  M: FromEnv2<F>,
): <A>(fiber: Fiber<F, A>) => Hkt<F, [GetParentFiber2<F>, Option<Fiber2<F, unknown>>]>
export function getParent<F extends URIS3>(
  M: FromEnv3<F>,
): <A, E>(fiber: Fiber<F, A>) => Hkt<F, [GetParentFiber3<F>, E, Option<Fiber3<F, E, unknown>>]>
export function getParent<F extends URIS4>(
  M: FromEnv4<F>,
): <A, S, E>(
  fiber: Fiber<F, A>,
) => Hkt<F, [S, GetParentFiber4<F>, E, Option<Fiber4<F, S, E, unknown>>]>
export function getParent<F>(
  M: FromEnv<F>,
): <A>(fiber: Fiber<F, A>) => Hkt<F, [GetParentFiber<F>, Option<Fiber<F, unknown>>]>
export function getParent<F>(M: FromEnv<F>) {
  return <A>(fiber: Fiber<F, A>) =>
    M.fromEnv(({ getParentFiber }: GetParentFiber<F>) => getParentFiber(fiber))
}

export type GetChildFibers<F> = {
  readonly getChildFibers: <A>(fiber: Fiber<F, A>) => Resume<ReadonlyArray<Fiber<F, unknown>>>
}

export type GetChildFibers2<F extends URIS2> = {
  readonly getChildFibers: <A>(fiber: Fiber2<F, A>) => Resume<ReadonlyArray<Fiber2<F, unknown>>>
}

export type GetChildFibers3<F extends URIS3> = {
  readonly getChildFibers: <E, A>(
    fiber: Fiber3<F, E, A>,
  ) => Resume<ReadonlyArray<Fiber3<F, E, unknown>>>
}

export type GetChildFibers4<F extends URIS4> = {
  readonly getChildFibers: <S, E, A>(
    fiber: Fiber4<F, S, E, A>,
  ) => Resume<ReadonlyArray<Fiber4<F, S, E, unknown>>>
}

export function getChildren<F extends URIS2>(
  M: FromEnv2<F>,
): <A>(fiber: Fiber<F, A>) => Hkt<F, [GetChildFibers2<F>, ReadonlyArray<Fiber2<F, unknown>>]>
export function getChildren<F extends URIS3>(
  M: FromEnv3<F>,
): <A, E>(
  fiber: Fiber<F, A>,
) => Hkt<F, [GetChildFibers3<F>, E, ReadonlyArray<Fiber3<F, E, unknown>>]>
export function getChildren<F extends URIS4>(
  M: FromEnv4<F>,
): <A, S, E>(
  fiber: Fiber<F, A>,
) => Hkt<F, [S, GetChildFibers4<F>, E, ReadonlyArray<Fiber4<F, S, E, unknown>>]>
export function getChildren<F>(
  M: FromEnv<F>,
): <A>(fiber: Fiber<F, A>) => Hkt<F, [GetChildFibers<F>, ReadonlyArray<Fiber<F, unknown>>]>
export function getChildren<F>(M: FromEnv<F>) {
  return <A>(fiber: Fiber<F, A>) =>
    M.fromEnv(({ getChildFibers }: GetChildFibers<F>) => getChildFibers(fiber))
}

export type PauseFiber = {
  // returns the status of the parent fiber
  readonly pauseFiber: Resume<FiberStatus<unknown>>
}

export function pause<F extends URIS2>(M: FromEnv2<F>): Hkt<F, [PauseFiber, FiberStatus<unknown>]>
export function pause<F extends URIS3, E>(
  M: FromEnv3<F>,
): Hkt<F, [PauseFiber, E, FiberStatus<unknown>]>
export function pause<F extends URIS4, S, E>(
  M: FromEnv4<F>,
): Hkt<F, [S, PauseFiber, E, FiberStatus<unknown>]>
export function pause<F>(M: FromEnv<F>): HKT2<F, PauseFiber, FiberStatus<unknown>>

export function pause<F>(M: FromEnv<F>): HKT2<F, PauseFiber, FiberStatus<unknown>> {
  return M.fromEnv((e: PauseFiber) => e.pauseFiber)
}

export type PlayFiber<F> = {
  readonly playFiber: <A>(fiber: Fiber<F, A>) => Resume<FiberStatus<A>>
}

export function play<F extends URIS2>(
  M: FromEnv2<F>,
): <A>(fiber: Fiber<F, A>) => Hkt<F, [PlayFiber<F>, FiberStatus<A>]>
export function play<F extends URIS3>(
  M: FromEnv3<F>,
): <A, E>(fiber: Fiber<F, A>) => Hkt<F, [PlayFiber<F>, E, FiberStatus<A>]>
export function play<F extends URIS3, E>(
  M: FromEnv3<F>,
): <A>(fiber: Fiber<F, A>) => Hkt<F, [PlayFiber<F>, E, FiberStatus<A>]>
export function play<F extends URIS4>(
  M: FromEnv4<F>,
): <A, S, E>(fiber: Fiber<F, A>) => Hkt<F, [S, PlayFiber<F>, E, FiberStatus<A>]>
export function play<F>(
  M: FromEnv<F>,
): <A>(fiber: Fiber<F, A>) => HKT2<F, PlayFiber<F>, FiberStatus<A>>

export function play<F>(M: FromEnv<F>) {
  return <A>(fiber: Fiber<F, A>) => M.fromEnv((e: PlayFiber<F>) => e.playFiber(fiber))
}
