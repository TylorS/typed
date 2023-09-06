import type * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Fiber from "@effect/io/Fiber"
import * as Scope from "@effect/io/Scope"
import * as SynchronizedRef from "@effect/io/SynchronizedRef"
import * as Context from "@typed/context"
import * as Sink from "@typed/fx/Sink"

// The core representation of an Fx is "just" an Effect with a Sink service it can push into.

// TODO: Extend Effect Unify to also unify Sink
// TODO: Implement dual for Push

export namespace Push {
  export type Any = Effect.Effect<any, any, any>

  export type Context<T extends Any> = Effect.Effect.Context<T>

  export namespace Context {
    export type Sink<T> = T extends Sink.Sink<infer E, infer A> | infer _ ? Sink.Sink<E, A> : never
    export type WithoutSink<T> = Exclude<T, Sink.Sink<any, any>>

    export type SinkError<T> = Sink.Sink.Error<T>
    export type SinkEvent<T> = Sink.Sink.Event<T>
  }

  export type Sink<T extends Any> = Context.Sink<Context<T>>

  export type ContextWithoutSink<T extends Any> = Context.WithoutSink<Context<T>>

  export type SinkError<T extends Any> = Context.SinkError<Context<T>>
  export type SinkEvent<T extends Any> = Context.SinkEvent<Context<T>>

  export type Error<T extends Any> = Effect.Effect.Error<T>
  export type Success<T extends Any> = Effect.Effect.Success<T>

  /*
   * Change the Sink's error and success value, optionally adding additional context
   * to the Effect.
   */
  export type MapBoth<P extends Effect.Effect<any, any, any>, E, A, R = never> = [
    Effect.Effect<
      ContextWithoutSink<P> | R | Sink.Sink<E, A>,
      Error<P>,
      Success<P>
    >
  ] extends [Effect.Effect<infer R2, infer E2, infer A2>] ? Effect.Effect<
      R2,
      E2,
      A2
    >
    : never

  /*
   * Change the Sink's error value, optionally adding additional context
   * to the Effect.
   */
  export type MapError<P extends Any, E, R = never> = MapBoth<P, E, Push.SinkEvent<P>, R>

  /*
   * Change the Sink's success value, optionally adding additional context
   * to the Effect.
   */
  export type MapSuccess<P extends Any, A, R = never> = MapBoth<P, Push.SinkError<P>, A, R>

  /**
   * Provide resources to the Effect.
   */
  export type Provide<P extends Any, R> = [
    Effect.Effect<
      Exclude<Context<P>, R>,
      Error<P>,
      Success<P>
    >
  ] extends [Effect.Effect<infer R2, infer E2, infer A2>] ? Effect.Effect<R2, E2, A2> : never

  export type SinkService<T extends Any, E = never, A = never> = Sink.SinkService<SinkError<T> | E, SinkEvent<T> | A>

  export type FlatMap<P extends Any, P2 extends Any> = [
    Effect.Effect<
      | Push.ContextWithoutSink<P>
      | Push.ContextWithoutSink<P2>
      | Sink.Sink<Push.SinkError<P> | Push.SinkError<P2>, Push.SinkEvent<P2>>,
      Push.Error<P> | Push.Error<P2>,
      Push.Success<P>
    >
  ] extends [Effect.Effect<infer R, infer E, infer A>] ? Effect.Effect<R, E, A> : never

  export type FlatMapCause<P extends Any, P2 extends Any> = [
    Effect.Effect<
      | Push.ContextWithoutSink<P>
      | Push.ContextWithoutSink<P2>
      | Sink.Sink<Push.SinkError<P2>, Push.SinkEvent<P> | Push.SinkEvent<P2>>,
      Push.Error<P> | Push.Error<P2>,
      Push.Success<P>
    >
  ] extends [Effect.Effect<infer R, infer E, infer A>] ? Effect.Effect<R, E, A> : never

  export type MatchCause<P extends Any, P2 extends Any, P3 extends Any> = [
    Effect.Effect<
      | Push.ContextWithoutSink<P>
      | Push.ContextWithoutSink<P2>
      | Push.ContextWithoutSink<P3>
      | Sink.Sink<
        Push.SinkError<P2> | Push.SinkError<P3>,
        Push.SinkEvent<P2> | Push.SinkEvent<P3>
      >,
      Push.Error<P> | Push.Error<P2> | Push.Error<P3>,
      Push.Success<P>
    >
  ] extends [Effect.Effect<infer R, infer E, infer A>] ? Effect.Effect<R, E, A> : never
}

export function mapSink<R, E, A, E0, A0, R2, E2, B>(
  push: Effect.Effect<R | Sink.Sink<E, A>, E0, A0>,
  f: (
    sink: Sink.SinkService<E2, B>
  ) => Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2 | Sink.Sink<E2, B>, E0, A0> {
  // TODO: Somehow manage Sink fusion
  return Effect.contextWithEffect((ctx) =>
    push.pipe(
      Sink.Sink<E, A>().provide(
        Sink.provide(f(Context.unsafeGet(ctx, Sink.Sink<E2, B>())), ctx)
      )
    )
  )
}

export function mapErrorCause<R, E, A, E0, A0, R2, E2, B>(
  push: Effect.Effect<R | Sink.Sink<E, A>, E0, A0>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Cause.Cause<B>>
): Effect.Effect<R | R2 | Sink.Sink<E2 | B, A>, E0, A0> {
  return mapSink(
    push,
    (sink) => Sink.mapErrorCause(sink, f)
  )
}

export function mapError<R, E, A, E0, A0, R2, E2, B>(
  push: Effect.Effect<R | Sink.Sink<E, A>, E0, A0>,
  f: (error: E) => Effect.Effect<R2, E2, B>
): Effect.Effect<R | R2 | Sink.Sink<E2 | B, A>, E0, A0> {
  return mapSink(
    push,
    (sink) => Sink.mapError(sink, f)
  )
}

export function mapEffect<R, E, A, E0, A0, R2, E2, B>(
  push: Effect.Effect<R | Sink.Sink<E, A>, E0, A0>,
  f: (value: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R | R2 | Sink.Sink<E | E2, B>, E0, A0> {
  return mapSink(
    push,
    (sink) => Sink.map(sink, f)
  )
}

export function tap<R, E, A, E0, A0, R2, E2, B>(
  push: Effect.Effect<R | Sink.Sink<E, A>, E0, A0>,
  f: (value: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R | R2 | Sink.Sink<E | E2, A>, E0, A0> {
  return mapSink(
    push,
    (sink) => Sink.tap(sink, f)
  )
}

export function matchCause<R, E, A, E0, A0, R2, E2, B, R3, E3, C>(
  push: Effect.Effect<R | Sink.Sink<E, A>, E0, A0>,
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  onSuccess: (a: A) => Effect.Effect<R3, E3, C>
): Effect.Effect<R | R2 | R3 | Sink.Sink<E2 | E3, B | C>, E0, A0> {
  return mapSink(
    push,
    (sink) => Sink.matchCause(sink, onFailure, onSuccess)
  )
}

export type ScopedFork = <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R, never, Fiber.Fiber.Runtime<E, A>>

export function withScopedFork<R, E, A>(
  f: (fork: ScopedFork, scope: Scope.Scope) => Effect.Effect<R, E, A>
): Effect.Effect<R, E, A> {
  return Effect.acquireUseRelease(
    Scope.make(),
    (scope) => f((effect) => Effect.forkIn(Effect.interruptible(effect), scope), scope),
    Scope.close
  )
}

export type ForkEffect<E, A> = <R>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R, never, Fiber.Fiber<E, A>>

export function withSwitchFork<E, A>() {
  return <R2, E2, B>(
    f: (fork: ForkEffect<E, A>, scope: Scope.Scope) => Effect.Effect<R2, E2, B>
  ): Effect.Effect<R2, E | E2, B> => {
    return withScopedFork((fork, scope) =>
      SynchronizedRef.make<Fiber.Fiber<E, A>>(Fiber.unit as any).pipe(
        Effect.flatMap((ref) => {
          return f(
            (effect) =>
              SynchronizedRef.updateAndGetEffect(
                ref,
                (fiber) => Effect.flatMap(Fiber.interrupt(fiber), () => fork(effect))
              ),
            scope
          )
            .pipe(
              Effect.flatMap((b) =>
                SynchronizedRef.get(ref).pipe(
                  Effect.flatMap((fiber) =>
                    fiber && Fiber.isRuntimeFiber(fiber)
                      ? Fiber.join(fiber)
                      : Effect.unit
                  ),
                  Effect.as(b)
                )
              )
            )
        })
      )
    )
  }
}

export function drain<R, E, A, E0, A0>(
  push: Effect.Effect<R | Sink.Sink<E, A>, E0, A0>
): Effect.Effect<Exclude<R, Sink.Sink<any, any>>, E | E0, A0> {
  return Sink.makeDrain<E, A, A0>().pipe(
    Effect.tap((drain) => drain.provide(push)),
    Effect.flatMap((drain) => drain.wait())
  )
}

export function observe<R, E, A, E0, A0, R2, E2, B>(
  push: Effect.Effect<R | Sink.Sink<E, A>, E0, A0>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<Exclude<R | R2, Sink.Sink<any, any>>, E | E0 | E2, A0> {
  return Sink.makeObserve<A0>()(f).pipe(
    Effect.tap((observe) => observe.provide(push)),
    Effect.flatMap((observe) => observe.wait())
  ) as any
}
