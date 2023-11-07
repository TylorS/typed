// Internal

import { type AsyncData, type Failure, type Loading, type Success } from "@typed/async-data/AsyncData"
import { FAILURE_TAG, LOADING_TAG, NO_DATA_TAG, SUCCESS_TAG } from "@typed/async-data/internal/tag"
import { Cause, Effect, Effectable, Equal, Hash, Option, pipe, Unify } from "effect"
import { constant } from "effect/Function"

export class FailureImpl<E> extends Effectable.Class<never, E, never> implements Failure<E> {
  readonly _tag = "Failure"

  commit: () => Effect.Effect<never, E, never>;

  [Unify.typeSymbol]!: unknown;
  [Unify.unifySymbol]!: AsyncData.Unify<this>;
  [Unify.blacklistSymbol]!: AsyncData.UnifyBlackList

  constructor(readonly cause: Cause.Cause<E>, readonly refreshing: Option.Option<Loading>) {
    super()

    this.commit = constant(Effect.failCause(cause))
  }

  [Equal.symbol](that: unknown) {
    return isAsyncData(that) && that._tag === "Failure"
      && Equal.equals(this.cause, that.cause)
      && Equal.equals(this.refreshing, that.refreshing)
  }

  [Hash.symbol]() {
    return pipe(
      Hash.string(this._tag),
      Hash.combine(Hash.hash(this.cause)),
      Hash.combine(Hash.hash(this.refreshing))
    )
  }
}

export class SuccessImpl<A> extends Effectable.Class<never, never, A> implements Success<A> {
  readonly _tag = "Success"

  commit: () => Effect.Effect<never, never, A>;

  [Unify.typeSymbol]!: unknown;
  [Unify.unifySymbol]!: AsyncData.Unify<this>;
  [Unify.blacklistSymbol]!: AsyncData.UnifyBlackList

  constructor(readonly value: A, readonly refreshing: Option.Option<Loading>) {
    super()

    this.commit = constant(Effect.succeed(value))
  }

  [Equal.symbol](that: unknown) {
    return isAsyncData(that) && that._tag === "Success"
      && Equal.equals(this.value, that.value)
      && Equal.equals(this.refreshing, that.refreshing)
  }

  [Hash.symbol]() {
    return pipe(
      Hash.string(this._tag),
      Hash.combine(Hash.hash(this.value)),
      Hash.combine(Hash.hash(this.refreshing))
    )
  }
}

export function hasDataOptions(u: Record<PropertyKey, unknown>): boolean {
  if ("timestamp" in u && "refreshing" in u) {
    return typeof u.timestamp === "bigint" && Option.isOption(u.refreshing)
  } else return false
}

export function hasEquality(u: Record<PropertyKey, unknown>): boolean {
  return Equal.symbol in u && Hash.symbol in u
}

export function isTaggedRecord(u: unknown): u is Record<PropertyKey, unknown> & { readonly _tag: unknown } {
  return isRecord(u) && "_tag" in u
}

export function isRecord(u: unknown): u is Record<PropertyKey, unknown> {
  return typeof u === "object" && u !== null && !Array.isArray(u)
}

export function isAsyncData<E, A>(u: unknown): u is AsyncData<E, A> {
  if (isTaggedRecord(u) && hasEquality(u)) {
    switch (u._tag) {
      case NO_DATA_TAG:
        return "timstamp" in u && typeof u.timestamp === "bigint"
      case LOADING_TAG:
        return "progress" in u && Option.isOption(u.progress)
      case FAILURE_TAG:
        return hasDataOptions(u) && "cause" in u && Cause.isCause(u.cause)
      case SUCCESS_TAG:
        return hasDataOptions(u) && "value" in u
      default:
        return false
    }
  } else return false
}
