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
import { Eq } from 'fp-ts/Eq'
import { L } from 'ts-toolbelt'
import { deepEqualsEq } from './Eq'
import { FromReader, FromReader2, FromReader3, FromReader4 } from 'fp-ts/FromReader'
import * as E from './Env'
import { Chain, Chain2, Chain3, Chain4 } from 'fp-ts/Chain'
import { identity, pipe } from 'fp-ts/function'

export interface Fiber<F, A> {
  // Fiber information
  readonly id: FiberId
  readonly status: HKT2<F, unknown, FiberStatus<A>>

  // References
  readonly getRef: <E, A>(ref: FiberRef<F, [E, A]>) => HKT2<F, E, A>
  readonly setRef: <A>(value: A) => <E>(ref: FiberRef<F, [E, A]>) => HKT2<F, E, A>
  readonly deleteRef: <E, A>(ref: FiberRef<F, [E, A]>) => HKT2<F, unknown, Option<A>>
}

export interface Fiber2<F extends URIS2, A> {
  // Fiber information
  readonly id: FiberId
  readonly status: Hkt<F, [unknown, FiberStatus<A>]>
  // References
  readonly getRef: <E, A>(ref: FiberRef<F, [E, A]>) => Hkt<F, [E, A]>
  readonly setRef: <A>(value: A) => <E>(ref: FiberRef<F, [E, A]>) => Hkt<F, [E, A]>
  readonly deleteRef: <E>(ref: FiberRef<F, [E, A]>) => Hkt<F, [unknown, Option<A>]>
}

export interface Fiber3<F extends URIS3, E, A> {
  // Fiber information
  readonly id: FiberId
  readonly status: Hkt<F, [unknown, E, FiberStatus<A>]>
  // References
  readonly getRef: <R, E, A>(ref: FiberRef<F, [R, E, A]>) => Hkt<F, [R, E, A]>
  readonly setRef: <A>(value: A) => <R, E>(ref: FiberRef<F, [R, E, A]>) => Hkt<F, [R, E, A]>
  readonly deleteRef: <R, E>(ref: FiberRef<F, [R, E, A]>) => Hkt<F, [unknown, E, Option<A>]>
}

export interface Fiber4<F extends URIS4, S, E, A> {
  // Fiber information
  readonly id: FiberId
  readonly status: Hkt<F, [S, unknown, E, FiberStatus<A>]>
  // References
  readonly getRef: <S, R, E, A>(ref: FiberRef<F, [S, R, E, A]>) => Hkt<F, [S, R, E, A]>
  readonly setRef: <A>(
    value: A,
  ) => <S, R, E>(ref: FiberRef<F, [S, R, E, A]>) => Hkt<F, [S, R, E, A]>
  readonly deleteRef: <S, R, E>(
    ref: FiberRef<F, [S, R, E, A]>,
  ) => Hkt<F, [S, unknown, E, Option<A>]>
}

export type FiberId = Branded<{ readonly FiberId: unique symbol }, symbol>
export const FiberId = Branded<FiberId>()

export interface FiberRef<F, Params extends readonly any[]> {
  readonly id: FiberRefId
  readonly initial: Hkt<F, Params>
  readonly eq: Eq<L.Last<Params>>
}

export function createRef<F extends URIS2, E, A>(
  initial: Hkt<F, [E, A]>,
  id?: FiberRefId,
  eq?: Eq<A>,
): FiberRef2<F, E, A>

export function createRef<F extends URIS3, R, E, A>(
  initial: Hkt<F, [R, E, A]>,
  id?: PropertyKey,
  eq?: Eq<A>,
): FiberRef3<F, R, E, A>

export function createRef<F extends URIS4, S, R, E, A>(
  initial: Hkt<F, [S, R, E, A]>,
  id?: PropertyKey,
  eq?: Eq<A>,
): FiberRef4<F, S, R, E, A>

export function createRef<F, E, A>(
  initial: HKT2<F, E, A>,
  id?: PropertyKey,
  eq?: Eq<A>,
): FiberRef<F, [E, A]>

export function createRef<F, Params extends readonly any[]>(
  initial: Hkt<F, Params>,
  id: PropertyKey = Symbol(),
  eq: Eq<L.Last<Params>> = deepEqualsEq,
): FiberRef<F, Params> {
  return {
    id: FiberRefId(id),
    initial,
    eq,
  }
}

export interface FiberRef2<F extends URIS2, E, A> extends FiberRef<F, [E, A]> {}
export interface FiberRef3<F extends URIS3, R, E, A> extends FiberRef<F, [R, E, A]> {}
export interface FiberRef4<F extends URIS4, S, R, E, A> extends FiberRef<F, [S, R, E, A]> {}

export type FiberRefId = Branded<{ readonly FiberRefId: unique symbol }, PropertyKey>
export const FiberRefId = Branded<FiberRefId>()

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
    onEvent: (event: A) => HKT2<F, unknown, any>,
  ) => Resume<Disposable>
}

export type ListenToEvents2<F extends URIS2> = {
  readonly listenToFiberEvents: <A extends FiberEvent<F, any>>(
    refinement: Refinement<FiberEvent<F, any>, A>,
    onEvent: (event: A) => Hkt<F, [unknown, any]>,
  ) => Resume<Disposable>
}

export type ListenToEvents3<F extends URIS3> = {
  readonly listenToFiberEvents: <A extends FiberEvent<F, any>, E>(
    refinement: Refinement<FiberEvent<F, any>, A>,
    onEvent: (event: A) => Hkt<F, [unknown, E, any]>,
  ) => Resume<Disposable>
}

export type ListenToEvents4<F extends URIS4> = {
  readonly listenToFiberEvents: <A extends FiberEvent<F, any>, S, E>(
    refinement: Refinement<FiberEvent<F, any>, A>,
    onEvent: (event: A) => Hkt<F, [S, unknown, E, any]>,
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

export function fromKey<F extends URIS2>(
  M: FromReader2<F>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => FiberRef2<F, Readonly<Record<K, A>>, A>

export function fromKey<F extends URIS3, E = unknown>(
  M: FromReader3<F>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => FiberRef3<F, Readonly<Record<K, A>>, E, A>

export function fromKey<F extends URIS4, S = unknown, E = unknown>(
  M: FromReader4<F>,
): <A>(
  eq?: Eq<A>,
) => <K extends PropertyKey>(key: K) => FiberRef4<F, S, Readonly<Record<K, A>>, E, A>

export function fromKey<F>(
  M: FromReader<F>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => FiberRef<F, [Readonly<Record<K, A>>, A]>

export function fromKey<F>(M: FromReader<F>) {
  return <A>(eq: Eq<A> = deepEqualsEq) => <K extends PropertyKey>(key: K) =>
    createRef(
      M.fromReader((e: Readonly<Record<K, A>>) => e[key]),
      FiberRefId(key),
      eq,
    )
}

export type CurrentFiber<F> = {
  readonly currentFiber: Fiber<F, unknown>
}

export function getRef<F extends URIS2>(
  M: FromEnv2<F> & Chain2<F>,
): <E, A>(ref: FiberRef2<F, E, A>) => Hkt<F, [E & CurrentFiber<F>, A]>
export function getRef<F extends URIS3>(
  M: FromEnv3<F> & Chain3<F>,
): <R, E, A>(ref: FiberRef3<F, R, E, A>) => Hkt<F, [R & CurrentFiber<F>, E, A]>
export function getRef<F extends URIS4>(
  M: FromEnv4<F> & Chain4<F>,
): <S, R, E, A>(ref: FiberRef4<F, S, R, E, A>) => Hkt<F, [S, R & CurrentFiber<F>, E, A]>
export function getRef<F>(
  M: FromEnv<F> & Chain<F>,
): <E, A>(ref: FiberRef<F, [E, A]>) => HKT2<F, E & CurrentFiber<F>, A>
export function getRef<F>(M: FromEnv<F> & Chain<F>) {
  return <E, A>(ref: FiberRef<F, [E, A]>) =>
    pipe(M.fromEnv(E.asks((e: CurrentFiber<F>) => e.currentFiber.getRef(ref))), M.chain(identity))
}

export function setRef<F extends URIS2>(
  M: FromEnv2<F> & Chain2<F>,
): <A>(value: A) => <E>(ref: FiberRef2<F, E, A>) => Hkt<F, [E & CurrentFiber<F>, A]>
export function setRef<F extends URIS3>(
  M: FromEnv3<F> & Chain3<F>,
): <A>(value: A) => <R, E>(ref: FiberRef3<F, R, E, A>) => Hkt<F, [R & CurrentFiber<F>, E, A]>
export function setRef<F extends URIS4>(
  M: FromEnv4<F> & Chain4<F>,
): <A>(
  value: A,
) => <S, R, E>(ref: FiberRef4<F, S, R, E, A>) => Hkt<F, [S, R & CurrentFiber<F>, E, A]>
export function setRef<F>(
  M: FromEnv<F> & Chain<F>,
): <A>(value: A) => <E>(ref: FiberRef<F, [E, A]>) => HKT2<F, E & CurrentFiber<F>, A>
export function setRef<F>(M: FromEnv<F> & Chain<F>) {
  return <A>(value: A) => <E>(ref: FiberRef<F, [E, A]>) =>
    pipe(
      M.fromEnv(E.asks((e: CurrentFiber<F>) => pipe(ref, e.currentFiber.setRef(value)))),
      M.chain(identity),
    )
}

export function deleteRef<F extends URIS2>(
  M: FromEnv2<F> & Chain2<F>,
): <E, A>(ref: FiberRef2<F, E, A>) => Hkt<F, [CurrentFiber<F>, Option<A>]>
export function deleteRef<F extends URIS3>(
  M: FromEnv3<F> & Chain3<F>,
): <R, E, A>(ref: FiberRef3<F, R, E, A>) => Hkt<F, [CurrentFiber<F>, E, Option<A>]>
export function deleteRef<F extends URIS4>(
  M: FromEnv4<F> & Chain4<F>,
): <S, R, E, A>(ref: FiberRef4<F, S, R, E, A>) => Hkt<F, [S, CurrentFiber<F>, E, Option<A>]>
export function deleteRef<F>(
  M: FromEnv<F> & Chain<F>,
): <E, A>(ref: FiberRef<F, [E, A]>) => HKT2<F, CurrentFiber<F>, Option<A>>
export function deleteRef<F>(M: FromEnv<F> & Chain<F>) {
  return <E, A>(ref: FiberRef<F, [E, A]>) =>
    pipe(
      M.fromEnv(E.asks((e: CurrentFiber<F>) => e.currentFiber.deleteRef(ref))),
      M.chain(identity),
    )
}
