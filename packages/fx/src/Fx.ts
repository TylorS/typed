import * as Either from "@effect/data/Either"
import * as Option from "@effect/data/Option"
import type * as Cause from "@effect/io/Cause"
import * as Deferred from "@effect/io/Deferred"
import * as Eff from "@effect/io/Effect"
import * as Exit from "@effect/io/Exit"
import * as Scope from "@effect/io/Scope"
import * as Sink from "@typed/fx/Sink"

export const FxTypeId = Symbol.for("@typed/fx/Fx")
export type FxTypeId = typeof FxTypeId

export interface Fx<R, E, A> extends Eff.Effect<R | Sink.Sink<E, A>, never, unknown> {
  readonly [FxTypeId]: Fx.Variance<R, E, A>
}

export namespace Fx {
  export interface Variance<R, E, A> {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }

  export type WithExclude<R, E, A> = Fx<Exclude<R, Sink.Sink<any, any>>, E, A> extends Fx<infer _R, infer _E, infer _A>
    ? Fx<_R, _E, _A>
    : never

  export type Context<T extends Eff.Effect<any, any, any>> = Eff.Effect.Context<T> extends infer R ? R : never

  export type Error<T extends Eff.Effect<any, any, any>> =
    | Sink.Sink.ExtractError<Eff.Effect.Context<T>>
    | Eff.Effect.Error<T>

  export type Success<T extends Eff.Effect<any, any, any>> = Sink.Sink.ExtractEvent<Eff.Effect.Context<T>>

  const Variance: Variance<any, any, any> = {
    _R: (_: never) => _,
    _E: (_: never) => _,
    _A: (_: never) => _
  }

  export function make<R, E = never, A = never>(
    effect: Eff.Effect<R | Sink.Error<E> | Sink.Event<A>, never, void>
  ): Fx.WithExclude<R, E, A> {
    return Object.assign(effect, {
      [FxTypeId]: Variance
    }) as any
  }

  type GenResources<T> = [T] extends [never] ? never : [T] extends [Eff.EffectGen<infer R, any, any>] ? R : never
  type GenError<T> = [T] extends [never] ? never : [T] extends [Eff.EffectGen<any, infer E, any>] ? E : never

  export interface Adapter extends Eff.Adapter {
    readonly event: <A>(a: A) => Eff.EffectGen<Sink.Event<A>, never, void>
    readonly failCause: <E>(e: Cause.Cause<E>) => Eff.EffectGen<Sink.Error<E>, never, void>
    readonly fail: <E>(e: E) => Eff.EffectGen<Sink.Error<E>, never, void>
  }

  export const makeGen: <E extends Eff.EffectGen<any, any, any>>(
    f: (resume: Adapter) => Generator<E, unknown, any>
  ) => Fx.WithExclude<
    GenResources<E>,
    Sink.Sink.ExtractError<GenResources<E>> | GenError<E>,
    Sink.Sink.ExtractEvent<GenResources<E>>
  > = (f) =>
    make(
      Eff.gen((adapter) => {
        const modified: Adapter = Object.assign(
          adapter.bind(null),
          {
            event: <A>(a: A) => adapter(Sink.event(a)),
            failCause: <E>(cause: Cause.Cause<E>) => adapter(Sink.failCause(cause)),
            fail: <E>(error: E) => adapter(Sink.fail(error))
          } as const
        )

        return f(modified)
      }).pipe(Eff.catchAllCause(Sink.failCause))
    )
}

export type FxInput<R, E, A> =
  | Fx<R, E, A>
  | Eff.Effect<R, E, A>

export const empty: Fx<never, never, never> = Fx.make(Eff.unit)
export const never: Fx<never, never, never> = Fx.make(Eff.never)

export function fromEffect<R, E, A>(
  effect: Eff.Effect<R, E, A>
): Fx.WithExclude<R, E, A> {
  return Fx.make(
    Eff.flatMap(Sink.Sink<E, A>(), (sink) => Eff.matchCauseEffect(effect, sink))
  )
}

export function fromOption<A>(option: Option.Option<A>): Fx<never, never, A> {
  if (Option.isNone(option)) {
    return empty
  } else {
    return Fx.make(
      Sink.event(option.value)
    )
  }
}

export function fromEither<E, A>(either: Either.Either<E, A>): Fx<never, E, A> {
  if (Either.isLeft(either)) {
    return Fx.make(
      Sink.fail(either.left)
    )
  } else {
    return Fx.make(
      Sink.event(either.right)
    )
  }
}

export function fromExit<E, A>(exit: Exit.Exit<E, A>): Fx<never, E, A> {
  if (Exit.isFailure(exit)) {
    return Fx.make(
      Sink.failCause(exit.cause)
    )
  } else {
    return Fx.make(
      Sink.event(exit.value)
    )
  }
}

export function fromInput<R, E, A>(input: FxInput<R, E, A>): Fx.WithExclude<R, E, A> {
  if (FxTypeId in input) {
    return input as any
  } else {
    return fromEffect(input)
  }
}

export function drain<R, E, A>(
  input: FxInput<R, E, A>
): Eff.Effect<Exclude<R, Sink.Sink<any, any>>, Sink.Sink.ExtractError<R> | E, void> {
  const fx = fromInput<R, E, A>(input)

  return Eff.acquireUseRelease(
    Scope.make(),
    (scope) =>
      Eff.flatMap(
        Sink.drain<E, A>(),
        ({ deferred, sink }) =>
          Eff.tap(Eff.provideSomeContext(Eff.forkIn(fx, scope), sink), () => Deferred.await(deferred))
      ),
    Scope.close
  )
}

export function map<R, E, A, B>(
  input: FxInput<R, E, A>,
  f: (a: A) => B
): Fx.WithExclude<R, E, B> {
  return Fx.make(Sink.map(fromInput(input), f))
}
