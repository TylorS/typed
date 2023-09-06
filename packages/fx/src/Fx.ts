import * as Equal from "@effect/data/Equal"
import { identity } from "@effect/data/Function"
import * as Hash from "@effect/data/Hash"
import { pipeArguments } from "@effect/data/Pipeable"
import type * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Push from "@typed/fx/Push"
import * as Sink from "@typed/fx/Sink"

// TODO: Implement Unify
// TODO: Implement dual for Fx

export const TypeId = Symbol("@typed/fx/Fx")
export type TypeId = typeof TypeId

const Variance = {
  _R: identity,
  _E: identity,
  _A: identity
}

export interface Fx<R, E, A> extends Effect.Effect<R | Sink.Sink<E, A>, never, unknown> {
  readonly [TypeId]: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }
}

class FxImpl<R, E, A> implements Fx<R, E, A> {
  readonly _tag = "Commit"

  readonly [TypeId] = Variance as any
  readonly [Effect.EffectTypeId] = Variance

  constructor(
    readonly i0: Effect.Effect<R | Sink.Sink<E, A>, never, unknown>,
    readonly i1?: unknown,
    readonly i2?: unknown
  ) {}

  [Equal.symbol](that: unknown): boolean {
    return that instanceof FxImpl && Equal.equals(this.i0, that.i0)
  }

  [Hash.symbol](): number {
    return Hash.combine(Hash.hash(TypeId))(Hash.hash(this.i0))
  }

  pipe() {
    return pipeArguments(this.i0, arguments)
  }

  commit() {
    return this.i0
  }
}

export namespace Fx {
  export type Context<T> = [T] extends [Fx<infer R, infer _, infer __>] ? R : never
  export type Error<T> = [T] extends [Fx<any, infer E, any>] ? E : never
  export type Success<T> = [T] extends [Fx<any, any, infer A>] ? A : never

  export type ExcludeSink<T> = Exclude<T, Sink.Sink<any, any>>
  export type ExtractSink<T> = Extract<T, Sink.Sink<any, any>>

  export type WithoutSink<R, E, A> = Fx<ExcludeSink<R>, E, A>
}

export function fromPush<R, E, A, E0, A0>(
  push: Effect.Effect<R | Sink.Sink<E, A>, E0, A0>
): Fx.WithoutSink<R, E | E0, A> {
  return new FxImpl<R, E | E0, A>(Effect.catchAllCause(push, Sink.failCause))
}

export function mapErrorCauseEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Cause.Cause<B>>
): Fx.WithoutSink<R | R2, E2 | B, A> {
  return fromPush(Push.mapErrorCause(fx, f))
}

export function mapErrorEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => Effect.Effect<R2, E2, B>
): Fx.WithoutSink<R | R2, E2 | B, A> {
  return fromPush(Push.mapError(fx, f))
}

export function mapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Fx.WithoutSink<R | R2, E | E2, B> {
  return fromPush(Push.mapEffect(fx, f))
}

export function tap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Fx.WithoutSink<R | R2, E | E2, A> {
  return fromPush(Push.tap(fx, f))
}

const withSwitchFork = Push.withSwitchFork<never, unknown>()

export function switchMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>
): Fx.WithoutSink<R | R2, E | E2, B> {
  return new FxImpl(
    withSwitchFork((fork) =>
      Push.mapSink(fx, (sink) => Sink.WithContext("SwitchMap", sink.onFailure, (a) => fork(f(a))))
    )
  )
}

export function drain<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, void> {
  return Push.drain(fx)
}

export function observe<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R, E | E2, unknown> {
  return Push.observe(fx, f) as any
}

export function toArray<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, Array<A>> {
  return Effect.suspend(() => {
    const array: Array<A> = []

    return Push.observe(fx, (a) => Effect.sync(() => array.push(a))).pipe(
      Effect.map(() => array)
    )
  })
}

export function toReadonlyArray<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, ReadonlyArray<A>> {
  return toArray(fx)
}
