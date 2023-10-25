// Internal

import type { AsyncData, Failure, Loading, Success } from "@typed/async-data/AsyncData"
import type { Cause } from "effect"
import { Effect, Effectable, Equal, Hash, Option, pipe, Unify } from "effect"
import { constant } from "effect/Function"

export const defaultClock = Effect.runSync(Effect.clock)
export const currentTimestamp = () => defaultClock.unsafeCurrentTimeNanos()

export class FailureImpl<E> extends Effectable.Class<never, E, never> implements Failure<E> {
  readonly _tag = "Failure"

  commit: () => Effect.Effect<never, E, never>;

  [Unify.typeSymbol]!: unknown;
  [Unify.unifySymbol]!: AsyncData.Unify<this>;
  [Unify.blacklistSymbol]!: AsyncData.UnifyBlackList

  constructor(readonly cause: Cause.Cause<E>, readonly timestamp: bigint, readonly refreshing: Option.Option<Loading>) {
    super()

    this.commit = constant(Effect.failCause(cause))
  }

  [Equal.symbol](that: unknown) {
    return that instanceof FailureImpl
      && Equal.equals(this.cause, that.cause)
      && Equal.equals(this.timestamp, that.timestamp)
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

export class SuccessImpl<A> extends Effectable.Class<never, never, A> implements Success<A> {
  readonly _tag = "Success"

  commit: () => Effect.Effect<never, never, A>;

  [Unify.typeSymbol]!: unknown;
  [Unify.unifySymbol]!: AsyncData.Unify<this>;
  [Unify.blacklistSymbol]!: AsyncData.UnifyBlackList

  constructor(readonly value: A, readonly timestamp: bigint, readonly refreshing: Option.Option<Loading>) {
    super()

    this.commit = constant(Effect.succeed(value))
  }

  [Equal.symbol](that: unknown) {
    return that instanceof SuccessImpl
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
