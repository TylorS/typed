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
    T extends Push<infer R, infer _E, infer _A, infer _E1, infer _A1> ? R
    : never

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

export function mapSink<R, E, A, E0, A0, R2, E2, B>(
  push: Push<R, E, A, E0, A0>,
  f: (
    sink: Sink.SinkService<E2, B>
  ) => Sink.WithContext<R2, E, A>
): Push<Exclude<R, Sink.Sink<E, A>> | R2, E2, B, E0, A0> {
  const ea = Sink.Sink<E, A>()
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

export function mapErrorCause<R, E, A, E0, A0, R2, E2, B>(
  push: Push<R, E, A, E0, A0>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Cause.Cause<B>>
): Push<R | R2, E2 | B, A, E0, A0> {
  return mapSink(
    push,
    (sink) => Sink.mapErrorCause(sink, f)
  )
}

export function mapError<R, E, A, E0, A0, R2, E2, B>(
  push: Push<R, E, A, E0, A0>,
  f: (error: E) => Effect.Effect<R2, E2, B>
): Push<R | R2, E2 | B, A, E0, A0> {
  return mapSink(
    push,
    (sink) => Sink.mapError(sink, f)
  )
}

export function mapEffect<R, E = never, A = never, E0 = never, A0 = unknown, R2 = never, E2 = never, B = unknown>(
  push: Push<R, E, A, E0, A0>,
  f: (value: A) => Effect.Effect<R2, E2, B>
): Push<R | R2, E | E2, B, E0, A0> {
  return mapSink(
    push,
    (sink) => Sink.map(sink, f)
  )
}

export function tapEffect<R, E, A, E0, A0, R2, E2, B>(
  push: Push<R, E, A, E0, A0>,
  f: (value: A) => Effect.Effect<R2, E2, B>
): Push<R | R2, E | E2, A, E0, A0> {
  return mapSink(
    push,
    (sink) => Sink.tap(sink, f)
  )
}

export function matchCause<R, E, A, E0, A0, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, E0, A0>,
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  onSuccess: (a: A) => Effect.Effect<R3, E3, C>
): Push<R | R2 | R3, E2 | E3, B | C, E0, A0> {
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

export function drain<R, E, A, E0, A0>(
  push: Effect.Effect<R | Sink.Sink<E, A>, E0, A0>
): Effect.Effect<R, E | E0, A0> {
  return Effect.flatMap(Sink.makeDrain<E, A, A0>(), (deferredSink) => Sink.runDeferredSink(push, deferredSink))
}

export function observe<R, E, A, E0, A0, R2, E2, B>(
  push: Push<R, E, A, E0, A0>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R | R2, E | E0 | E2, A0> {
  return Effect.flatMap(
    Sink.makeObserve<R2, E2, A, E, A0>(f),
    (deferredSink) => Sink.runDeferredSink(push, deferredSink)
  )
}
