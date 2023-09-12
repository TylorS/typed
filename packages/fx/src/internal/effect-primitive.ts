import type * as Either from "@effect/data/Either"
import type { LazyArg } from "@effect/data/Function"
import type * as Option from "@effect/data/Option"
import type * as Cause from "@effect/io/Cause"
import type * as Effect from "@effect/io/Effect"
import type * as Exit from "@effect/io/Exit"
import type * as Fiber from "@effect/io/Fiber"
import type * as FiberId from "@effect/io/FiberId"
import type * as FiberStatus from "@effect/io/FiberStatus"
import type * as BlockedRequests from "@effect/io/RequestBlock"
import type * as RuntimeFlags from "@effect/io/RuntimeFlags"
import type * as RuntimeFlagsPatch from "@effect/io/RuntimeFlagsPatch"

// -----------------------------------------------------------------------------
// Effect - very low-level effect primitives
// NOTE: This probably isn't the greatest decision I've ever made, but I really wanna explore
// an initial encoding of streams utilizing Effect as the basis with intrinsic interoperation.
// -----------------------------------------------------------------------------

/** @internal */
export const EffectTypeId: Effect.EffectTypeId = Symbol.for("@effect/io/Effect") as Effect.EffectTypeId

export type InternalEffect = EffectPrimitive | EffectContinuation

/** @internal */
export type EffectPrimitive =
  | Async
  | Blocked
  | Commit
  | Either.Either<any, any>
  | Failure
  | FailureWithAnnotation
  | OpTag
  | Option.Option<any>
  | RunBlocked
  | Success
  | Sync
  | UpdateRuntimeFlags
  | WithRuntime
  | Yield

/** @internal */
export type EffectContinuation =
  | OnSuccess
  | OnStep
  | OnSuccessAndFailure
  | OnFailure
  | While
  | RevertFlags

/** @internal */
export enum OpCodes {
  OP_ASYNC = "Async",
  OP_BLOCKED = "Blocked",
  OP_COMMIT = "Commit",
  OP_FAILURE = "Failure",
  OP_FAILURE_WITH_ANNOTATION = "FailureWithAnnotation",
  OP_ON_FAILURE = "OnFailure",
  OP_ON_STEP = "OnStep",
  OP_ON_SUCCESS = "OnSuccess",
  OP_ON_SUCCESS_AND_FAILURE = "OnSuccessAndFailure",
  OP_REVERT_FLAGS = "RevertFlags",
  OP_RUN_BLOCKED = "RunBlocked",
  OP_SUCCESS = "Success",
  OP_SYNC = "Sync",
  OP_TAG = "Tag",
  OP_UPDATE_RUNTIME_FLAGS = "UpdateRuntimeFlags",
  OP_WHILE = "While",
  OP_WITH_RUNTIME = "WithRuntime",
  OP_YIELD = "Yield"
}

/** @internal */
export interface RevertFlags extends Effect.Effect<never, never, never> {
  readonly _tag: OpCodes.OP_REVERT_FLAGS
  readonly patch: RuntimeFlagsPatch.RuntimeFlagsPatch
  readonly op: EffectPrimitive & { _tag: OpCodes.OP_UPDATE_RUNTIME_FLAGS }
}

/** @internal */
export type Op<Tag extends string, Body = {}> = Effect.Effect<never, never, never> & Body & {
  readonly _tag: Tag
}

/** @internal */
export interface Async extends
  Op<OpCodes.OP_ASYNC, {
    readonly i0: (resume: (effect: EffectPrimitive) => void) => void
    readonly i1: FiberId.FiberId
  }>
{}

/** @internal */
export interface Blocked<R = any, E = any, A = any> extends
  Op<OpCodes.OP_BLOCKED, {
    readonly i0: BlockedRequests.RequestBlock<R>
    readonly i1: Effect.Effect<R, E, A>
  }>
{}

/** @internal */
export interface RunBlocked<R = any> extends
  Op<OpCodes.OP_RUN_BLOCKED, {
    readonly i0: BlockedRequests.RequestBlock<R>
  }>
{}

/** @internal */
export interface Failure extends
  Op<OpCodes.OP_FAILURE, {
    readonly i0: Cause.Cause<unknown>
  }>
{}

/** @internal */
export interface FailureWithAnnotation extends
  Op<OpCodes.OP_FAILURE_WITH_ANNOTATION, {
    readonly i0: (annotate: <E>(cause: Cause.Cause<E>) => Cause.Cause<E>) => Cause.Cause<unknown>
  }>
{}

/** @internal */
export interface OpTag extends Op<OpCodes.OP_TAG, {}> {}

export interface Commit extends
  Op<OpCodes.OP_COMMIT, {
    commit(): Effect.Effect<unknown, unknown, unknown>
  }>
{}

/** @internal */
export interface OnFailure extends
  Op<OpCodes.OP_ON_FAILURE, {
    readonly i0: EffectPrimitive
    readonly i1: (a: Cause.Cause<unknown>) => EffectPrimitive
  }>
{}

/** @internal */
export interface OnSuccess extends
  Op<OpCodes.OP_ON_SUCCESS, {
    readonly i0: EffectPrimitive
    readonly i1: (a: unknown) => EffectPrimitive
  }>
{}

/** @internal */
export interface OnStep extends
  Op<OpCodes.OP_ON_STEP, {
    readonly i0: EffectPrimitive
    readonly i1: (result: Exit.Exit<any, any> | Blocked) => EffectPrimitive
  }>
{}

/** @internal */
export interface OnSuccessAndFailure extends
  Op<OpCodes.OP_ON_SUCCESS_AND_FAILURE, {
    readonly i0: EffectPrimitive
    readonly i1: (a: Cause.Cause<unknown>) => EffectPrimitive
    readonly i2: (a: unknown) => EffectPrimitive
  }>
{}

/** @internal */
export interface Success extends
  Op<OpCodes.OP_SUCCESS, {
    readonly i0: unknown
  }>
{}

/** @internal */
export interface Sync extends
  Op<OpCodes.OP_SYNC, {
    readonly i0: LazyArg<unknown>
  }>
{}

/** @internal */
export interface UpdateRuntimeFlags extends
  Op<OpCodes.OP_UPDATE_RUNTIME_FLAGS, {
    readonly i0: RuntimeFlagsPatch.RuntimeFlagsPatch
    readonly i1?: (oldRuntimeFlags: RuntimeFlags.RuntimeFlags) => EffectPrimitive
  }>
{}

/** @internal */
export interface While extends
  Op<OpCodes.OP_WHILE, {
    readonly i0: () => boolean
    readonly i1: () => EffectPrimitive
    readonly i2: (a: unknown) => void
  }>
{}

/** @internal */
export interface WithRuntime extends
  Op<OpCodes.OP_WITH_RUNTIME, {
    readonly i0: (fiber: Fiber.RuntimeFiber<unknown, unknown>, status: FiberStatus.Running) => EffectPrimitive
  }>
{}

/** @internal */
export interface Yield extends Op<OpCodes.OP_YIELD> {}

export function matchEffectPrimitive<B>(
  effect: InternalEffect,
  matchers: {
    readonly Success: (succes: Success) => B
    readonly Failure: (failure: Failure) => B
    readonly Sync: (sync: Sync) => B
    readonly Left: (left: Either.Left<any, any>) => B
    readonly Right: (right: Either.Right<any, any>) => B
    readonly Some: (some: Option.Some<any>) => B
    readonly None: (none: Option.None<any>) => B
    readonly Otherwise: (effect: InternalEffect) => B
  }
): B {
  if (effect._tag in matchers) {
    return matchers[effect._tag as keyof typeof matchers](effect as any)
  } else {
    return matchers.Otherwise(effect)
  }
}
