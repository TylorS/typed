// Internal

import type * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Effectable from "effect/Effectable"
import * as Equal from "effect/Equal"
import { constant, pipe } from "effect/Function"
import * as Hash from "effect/Hash"
import type * as Option from "effect/Option"
import { hasProperty } from "effect/Predicate"
import type { AsyncData, Failure, Loading, Optimistic, Success } from "../AsyncData.js"
import { AsyncDataTypeId } from "../TypeId.js"
import { FAILURE_TAG, OPTIMISTIC_TAG, SUCCESS_TAG } from "./tag.js"

// @ts-expect-error
export class FailureImpl<E> extends Effectable.Class<never, E, never> implements Failure<E> {
  readonly [AsyncDataTypeId]: AsyncDataTypeId = AsyncDataTypeId
  readonly _tag = FAILURE_TAG

  commit: () => Effect.Effect<never, E, never>

  constructor(readonly cause: Cause.Cause<E>, readonly timestamp: number, readonly refreshing: Option.Option<Loading>) {
    super()

    this.commit = constant(Effect.failCause(cause))
  }

  [Equal.symbol](that: unknown) {
    if (this === that) return true

    if (!isAsyncData(that) || that._tag !== FAILURE_TAG) return false

    return Equal.equals(this.cause, that.cause)
      && this.timestamp === that.timestamp
      && Equal.equals(this.refreshing, that.refreshing)
  }

  [Hash.symbol]() {
    return pipe(
      Hash.string(this._tag),
      Hash.combine(Hash.hash(this.cause)),
      Hash.combine(Hash.hash(this.timestamp)),
      Hash.combine(Hash.hash(this.refreshing))
    )
  }
}

// @ts-expect-error
export class SuccessImpl<A> extends Effectable.Class<A> implements Success<A> {
  readonly [AsyncDataTypeId]: AsyncDataTypeId = AsyncDataTypeId
  readonly _tag = SUCCESS_TAG

  commit: () => Effect.Effect<A>

  constructor(readonly value: A, readonly timestamp: number, readonly refreshing: Option.Option<Loading>) {
    super()

    this.commit = constant(Effect.succeed(value))
  }

  [Equal.symbol](that: unknown) {
    return isAsyncData(that) && that._tag === SUCCESS_TAG
      && Equal.equals(this.value, that.value)
      && Equal.equals(this.timestamp, that.timestamp)
      && Equal.equals(this.refreshing, that.refreshing)
  }

  [Hash.symbol]() {
    return pipe(
      Hash.string(this._tag),
      Hash.combine(Hash.hash(this.value)),
      Hash.combine(Hash.hash(this.timestamp)),
      Hash.combine(Hash.hash(this.refreshing))
    )
  }
}

// @ts-expect-error
export class OptimisticImpl<A, E> extends Effectable.Class<A> implements Optimistic<A, E> {
  readonly [AsyncDataTypeId]: AsyncDataTypeId = AsyncDataTypeId
  readonly _tag = OPTIMISTIC_TAG

  commit: () => Effect.Effect<A>

  constructor(
    readonly value: A,
    readonly timestamp: number,
    readonly previous: AsyncData<A, E>
  ) {
    super()

    this.commit = constant(Effect.succeed(value))
  }

  [Equal.symbol](that: unknown) {
    return isAsyncData(that) && that._tag === OPTIMISTIC_TAG
      && Equal.equals(this.value, that.value)
      && Equal.equals(this.timestamp, that.timestamp)
      && Equal.equals(this.previous, that.previous)
  }

  [Hash.symbol]() {
    return pipe(
      Hash.string(this._tag),
      Hash.combine(Hash.hash(this.value)),
      Hash.combine(Hash.hash(this.timestamp)),
      Hash.combine(Hash.hash(this.previous))
    )
  }
}

export function isAsyncData<E, A>(u: unknown): u is AsyncData<E, A> {
  return hasProperty(u, AsyncDataTypeId)
}
