import * as Either from "@effect/data/Either"
import * as Equal from "@effect/data/Equal"
import { dual, identity } from "@effect/data/Function"
import * as Hash from "@effect/data/Hash"
import { pipeArguments } from "@effect/data/Pipeable"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Push from "@typed/fx/Push"
import * as Sink from "@typed/fx/Sink"
// TODO: Implement Unify
// TODO: Implement dual for Fx

export const TypeId = Symbol("@typed/fx/Fx")
export type TypeId = typeof TypeId

const Variance: Fx.Variance<any, any, any> = {
  _R: identity,
  _E: identity,
  _A: identity
}

/**
 * Fx is a push-based stream that can be used to push values and errors into a Sink.
 * It is a strict subset of an Effect which does not fail directly and doesn't have any
 * meaningful output.
 */
export interface Fx<out R, out E, out A> extends Effect.Effect<R | Sink.Sink<E, A>, never, unknown> {
  readonly [TypeId]: Fx.Variance<R, E, A>
}

export namespace Fx {
  export type Any = Fx<any, any, any>

  export type Context<T> = [T] extends [Fx<infer R, infer _, infer __>] ? R : never
  export type Error<T> = [T] extends [Fx<any, infer E, any>] ? E : never
  export type Success<T> = [T] extends [Fx<any, any, infer A>] ? A : never

  export type ExcludeSink<T> = Exclude<T, Sink.Sink<any, any>>
  export type ExtractSink<T> = Extract<T, Sink.Sink<any, any>>

  export type WithoutSink<R, E, A, R2 = never> = [Fx<ExcludeSink<R> | R2, E, A>] extends
    [Fx<infer _R, infer _E, infer _A>] ? Fx<_R, _E, _A> : never

  export interface Variance<out R, out E, out A> {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }
}

class FxImpl<R, E, A> implements Fx<Fx.ExcludeSink<R>, E, A> {
  readonly _tag = "Commit"

  readonly [TypeId]: Fx.Variance<Fx.ExcludeSink<R>, E, A> = Variance as any
  readonly [Effect.EffectTypeId]: Effect.Effect.Variance<
    Fx.ExcludeSink<R> | Sink.Sink<E, A>,
    never,
    unknown
  >[Effect.EffectTypeId] = Variance as any

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

export function fromPush<R, E0, A0>(
  push: Effect.Effect<R, E0, A0>
): Fx.WithoutSink<R, Push.Push.SinkError<typeof push> | E0, Push.Push.SinkEvent<typeof push>> {
  return new FxImpl<R, Push.Push.SinkError<typeof push> | E0, Push.Push.SinkEvent<typeof push>>(
    Effect.catchAllCause(push, Sink.failCause)
  )
}

export function succeed<A>(a: A): Fx<never, never, A> {
  return new FxImpl<never, never, A>(Sink.event(a))
}

export function succeedAll<const A extends ReadonlyArray<any>>(values: A): Fx<never, never, A[number]> {
  return new FxImpl(Sink.events(values))
}

export function failCause<E>(e: Cause.Cause<E>): Fx<never, E, never> {
  return new FxImpl(Sink.failCause(e))
}

export function fail<E>(e: E): Fx<never, E, never> {
  return new FxImpl(Sink.fail(e))
}

export const mapErrorCauseEffect: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Cause.Cause<B>>
  ): <R, A>(fx: Fx<R, E, A>) => Fx.WithoutSink<R, E2 | B, A, R2>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Cause.Cause<B>>
  ): Fx.WithoutSink<R, E2 | B, A, R2>
} = dual(2, function mapErrorCauseEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Cause.Cause<B>>
): Fx.WithoutSink<R, E2 | B, A, R2> {
  return fromPush(Push.mapErrorCause(fx, f))
})

export const mapErrorEffect: {
  <E, R2, E2, B>(
    f: (error: E) => Effect.Effect<R2, E2, B>
  ): <R, A>(fx: Fx<R, E, A>) => Fx.WithoutSink<R, E2 | B, A, R2>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (error: E) => Effect.Effect<R2, E2, B>
  ): Fx.WithoutSink<R, E2 | B, A, R2>
} = dual(2, function mapErrorEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => Effect.Effect<R2, E2, B>
): Fx.WithoutSink<R, E2 | B, A, R2> {
  return fromPush(Push.mapError(fx, f))
})

export const mapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): <R, E>(fx: Fx<R, E, A>) => Fx.WithoutSink<R, E | E2, B, R2>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Fx.WithoutSink<R, E | E2, B, R2>
} = dual(2, function mapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Fx.WithoutSink<R, E | E2, B, R2> {
  return fromPush(Push.mapEffect(fx, f))
})

export const tapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): <R, E>(fx: Fx<R, E, A>) => Fx.WithoutSink<R, E | E2, A, R2>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Fx.WithoutSink<R, E | E2, A, R2>
} = dual(2, function tapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Fx.WithoutSink<R, E | E2, A, R2> {
  return fromPush(Push.tapEffect(fx, f))
})

const withSwitchFork = Push.withSwitchFork<never>()

export const switchMap: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>
  ): <R, E>(fx: Fx<R, E, A>) => Fx.WithoutSink<R, E | E2, B, R2>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>
  ): Fx.WithoutSink<R, E | E2, B, R2>
} = dual(2, function switchMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>
): Fx.WithoutSink<R, E | E2, B, R2> {
  return new FxImpl(
    withSwitchFork((fork) =>
      Push.mapSink(fx, (sink) => Sink.WithContext("SwitchMap", sink.onFailure, (a) => fork(f(a))))
    )
  )
})

export function switchMapErrorCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx.WithoutSink<R | R2, E2, A | B> {
  return new FxImpl(
    withSwitchFork((fork) =>
      Push.mapSink(fx, (sink) => Sink.WithContext("SwitchMapErrorCause", (a) => fork(f(a)), sink.onSuccess))
    )
  )
}

export function switchMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => Fx<R2, E2, B>
): Fx.WithoutSink<R, E2, A | B, R2> {
  return switchMapErrorCause(fx, (cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: f,
      onRight: failCause
    }))
}

export function drain<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, void> {
  return Push.drain(fx)
}

export function observe<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R | R2, E | E2, unknown> {
  return Push.observe(fx, f)
}

export function toArray<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, Array<A>> {
  return Effect.suspend(() => {
    const array: Array<A> = []

    return Effect.as(
      Push.observe(fx, (a) => Effect.sync(() => array.push(a))),
      array
    )
  })
}

export function toReadonlyArray<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, ReadonlyArray<A>> {
  return toArray(fx)
}

export function mergeAll<FX extends ReadonlyArray<Fx.Any>>(
  ...fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return new FxImpl<
    Fx.Context<FX[number]>,
    Fx.Error<FX[number]>,
    Fx.Success<FX[number]>
  >(Effect.all(fxs, { concurrency: "unbounded", discard: true }) as any)
}
