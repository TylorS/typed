import type * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Fiber from "@effect/io/Fiber"
import * as Scope from "@effect/io/Scope"
import * as SynchronizedRef from "@effect/io/SynchronizedRef"
import * as Context from "@typed/context"
import * as Sink from "@typed/fx/Sink"

// The core representation of an Fx is "just" an Effect with a Sink service it can push into.

/**
 * Push is an Effect that can push errors and values into a Sink via the context.
 */
export interface Push<R, E, A, E1, A1> extends Effect.Effect<R | Sink.Sink<E, A>, E1, A1> {}

// TODO: Extend Effect Unify to also unify Sink
// TODO: Implement dual for Push

export namespace Push {
  export type Any = Push<any, any, any, any, any>

  export type From<T extends Any> = Push<
    Exclude<Context<T>, Sink.Sink<any, any>>,
    SinkError<T>,
    SinkEvent<T>,
    Error<T>,
    Success<T>
  >

  export type Context<T extends Any> = [T] extends [Effect.Effect<never, any, any>] ? never :
    T extends Push<infer R, infer _E, infer _A, infer _E1, infer _A1> ? Exclude<R, Sink.Sink<any, any>>
    : never

  export type ContextWithoutSink<T extends Any> = Exclude<Context<T>, Sink.Sink<any, any>>

  export type Sink<T extends Any> = [T] extends [Effect.Effect<never, any, any>] ? never :
    T extends Push<infer _R, infer E, infer A, infer _E1, infer _A1> ? Sink.Sink<
        E,
        A
      > :
    never

  export type SinkError<T extends Any> = [T] extends [Effect.Effect<never, any, any>] ? never :
    T extends Push<infer _R, infer E, infer _A, infer _E1, infer _A1> ? E
    : never

  export type SinkEvent<T extends Any> = [T] extends [Effect.Effect<never, any, any>] ? never :
    T extends Push<infer _R, infer _E, infer A, infer _E1, infer _A1> ? A
    : never

  export type Error<T extends Any> = Effect.Effect.Error<T>
  export type Success<T extends Any> = Effect.Effect.Success<T>
}

export function mapSink<P extends Push.Any, R2, E2, B>(
  push: P,
  f: (
    sink: Sink.SinkService<E2, B>
  ) => Sink.WithContext<R2, Push.SinkError<P>, Push.SinkEvent<P>>
): Push<Exclude<Push.Context<P>, Push.Sink<P>> | R2, E2, B, Push.Error<P>, Push.Success<P>> {
  const ea = Sink.Sink<Push.SinkError<P>, Push.SinkEvent<P>>()
  const e2b = Sink.Sink<E2, B>()

  // TODO: Somehow manage Sink fusion
  return Effect.contextWithEffect((ctx) =>
    push.pipe(
      ea.provide(
        Sink.provideContext(
          f(Context.unsafeGet(ctx, e2b)),
          ctx
        )
      )
    )
  )
}

export function mapErrorCause<P extends Push.Any, R2, E2, B>(
  push: P,
  f: (cause: Cause.Cause<Push.SinkError<P>>) => Effect.Effect<R2, E2, Cause.Cause<B>>
): Push<Exclude<Push.Context<P>, Push.Sink<P>> | R2, E2 | B, Push.SinkEvent<P>, Push.Error<P>, Push.Success<P>> {
  return mapSink(
    push,
    (sink) => Sink.mapErrorCause(sink, f)
  )
}

export function mapError<P extends Push.Any, R2, E2, B>(
  push: P,
  f: (error: Push.SinkError<P>) => Effect.Effect<R2, E2, B>
): Push<Exclude<Push.Context<P>, Push.Sink<P>> | R2, E2 | B, Push.SinkEvent<P>, Push.Error<P>, Push.Success<P>> {
  return mapSink(
    push,
    (sink) => Sink.mapError(sink, f)
  )
}

export function mapEffect<P extends Push.Any, R2, E2, B>(
  push: P,
  f: (value: Push.SinkEvent<P>) => Effect.Effect<R2, E2, B>
): Push<Exclude<Push.Context<P>, Push.Sink<P>> | R2, Push.SinkError<P> | E2, B, Push.Error<P>, Push.Success<P>> {
  return mapSink(
    push,
    (sink) => Sink.map(sink, f)
  )
}

export function tapEffect<P extends Push.Any, R2, E2, B>(
  push: P,
  f: (value: Push.SinkEvent<P>) => Effect.Effect<R2, E2, B>
): Push<
  Exclude<Push.Context<P>, Push.Sink<P>> | R2,
  Push.SinkError<P> | E2,
  Push.SinkEvent<P>,
  Push.Error<P>,
  Push.Success<P>
> {
  return mapSink(
    push,
    (sink) => Sink.tap(sink, f)
  )
}

export function matchCause<P extends Push.Any, R2, E2, B, R3, E3, C>(
  push: P,
  onFailure: (cause: Cause.Cause<Push.SinkError<P>>) => Effect.Effect<R2, E2, B>,
  onSuccess: (a: Push.SinkEvent<P>) => Effect.Effect<R3, E3, C>
): Push<Exclude<Push.Context<P>, Push.Sink<P>> | R2 | R3, E2 | E3, B | C, Push.Error<P>, Push.Success<P>> {
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

export type ForkEffect<E> = <R, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R, never, Fiber.Fiber<E, A>>

export function withSwitchFork<E>() {
  return <R2, E2, B>(
    f: (fork: ForkEffect<E>, scope: Scope.Scope) => Effect.Effect<R2, E2, B>
  ): Effect.Effect<R2, E | E2, B> => {
    return withScopedFork((fork, scope) =>
      SynchronizedRef.make<Fiber.Fiber<E, any>>(Fiber.unit).pipe(
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
                    Fiber.isRuntimeFiber(fiber)
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

export function drain<P extends Push.Any>(
  push: P
): Effect.Effect<Push.ContextWithoutSink<P>, Push.SinkError<P> | Push.Error<P>, Push.Success<P>> {
  return Effect.flatMap(
    Sink.makeDrain<Push.SinkError<P>, Push.SinkEvent<P>, Push.Success<P>>(),
    (deferredSink) => Sink.runDeferredSink(push, deferredSink)
  )
}

export function observe<P extends Push.Any, R2, E2, B>(
  push: P,
  f: (a: Push.SinkEvent<P>) => Effect.Effect<R2, E2, B>
): Effect.Effect<Push.ContextWithoutSink<P> | R2, Push.SinkError<P> | Push.Error<P> | E2, Push.Success<P>> {
  return Effect.flatMap(
    Sink.makeObserve<R2, E2, Push.SinkEvent<P>, Push.SinkError<P>, Push.Success<P>>(f),
    (deferredSink) => Sink.runDeferredSink(push, deferredSink)
  )
}
