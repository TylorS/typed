import type * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type * as Fiber from "@effect/io/Fiber"
import * as Scope from "@effect/io/Scope"
import type { Fx } from "@typed/fx/Fx"
import * as FromEffect from "@typed/fx/internal/fromEffect"
import * as Sink from "@typed/fx/Sink"

export const FxTypeId = Symbol.for("@typed/fx/Fx")
export type FxTypeId = typeof FxTypeId

/**
 * Annotates an Effect with FxTypeId to signal it is an Fx
 */
export function make<R, E = never, A = never>(
  effect: Effect.Effect<R | Sink.Error<E> | Sink.Event<A>, never, unknown>
): Fx.WithoutSink<R, E, A> {
  return Object.assign(effect, {
    [FxTypeId]: FxTypeId
  }) as Fx.WithoutSink<R, E, A>
}

/**
 * Creates an Fx from an Effect that is suspended such that the original Effect is not mutated
 */
export function makeSuspend<R, E = never, A = never>(
  effect: Effect.Effect<R | Sink.Error<E> | Sink.Event<A>, never, unknown>
): Fx.WithoutSink<R, E, A> {
  return make(Effect.suspend(() => effect))
}

export type GenResources<T> = [T] extends [never] ? never
  : [T] extends [Effect.EffectGen<infer R, any, any>] ? R
  : never

export type GenError<T> = [T] extends [never] ? never : [T] extends [Effect.EffectGen<any, infer E, any>] ? E : never

/**
 * A small extension to Effect.Adapter that adds a few more methods
 * for sending events and errors to a Sink.
 */
export type Adapter = Effect.Adapter & {
  readonly succeed: <A>(a: A) => Effect.EffectGen<Sink.Event<A>, never, void>
  readonly failCause: <E>(e: Cause.Cause<E>) => Effect.EffectGen<Sink.Error<E>, never, void>
  readonly fail: <E>(e: E) => Effect.EffectGen<Sink.Error<E>, never, void>
}

const adaptersCache = new WeakMap<Effect.Adapter, Adapter>()

/**
 * Construct an Adapter from an Effect.Adapter. This will cache the Adapter
 * so that we don't create a new one for each Fx since .bind is not exactly
 * cheap and there's probably only a single instance of an Effect.Adapter in your application.
 */
export function Adapter(effectAdapter: Effect.Adapter): Adapter {
  const cached = adaptersCache.get(effectAdapter)

  if (cached) {
    return cached
  } else {
    const adapter: Adapter = Object.assign(
      // Use .bind to make a clone of the function
      // so that we don't mutate the Effect.Adapter singleton
      effectAdapter.bind(null),
      {
        succeed: <A>(a: A) => effectAdapter(Sink.event(a)),
        failCause: <E>(cause: Cause.Cause<E>) => effectAdapter(Sink.failCause(cause)),
        fail: <E>(error: E) => effectAdapter(Sink.fail(error))
      } as const
    )

    adaptersCache.set(effectAdapter, adapter)

    return adapter
  }
}

/**
 * Create an Fx from a Generator function
 */
export const makeGen: <E extends Effect.EffectGen<any, any, any>>(
  f: (adapter: Adapter) => Generator<E, unknown, any>
) => Fx.WithoutSink<
  GenResources<E>,
  GenError<E>,
  never
> = (f) =>
  make(
    Effect.catchAllCause(Effect.gen((adapter) => f(Adapter(adapter))), Sink.failCause)
  )

/**
 * Converts an Effect into an Fx
 */
export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): Fx.WithoutSink<R, E, A> {
  return make(FromEffect.fromEffect(effect))
}

/**
 * Determines if a value is an Fx
 */
export function isFx<R, E, A>(value: unknown): value is Fx<R, E, A> {
  return isObject(value) && FxTypeId in value
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export type ScopedFork = <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R, never, Fiber.RuntimeFiber<E, A>>

/**
 * Helper for creating a locally isolated Scope for forking fibers in.
 * The fibers will automatically close when the scope is closed.
 */
export function withScopedFork<R, E, A>(
  f: (fork: ScopedFork, scope: Scope.Scope) => Effect.Effect<R, E, A>
): Effect.Effect<R, E, A> {
  return Effect.acquireUseRelease(Scope.make(), (scope) => f(Effect.forkIn(scope), scope), Scope.close)
}

/**
 * Execute an Fx as an Effect, providing a Sink to handle errors and events.
 */
export function drain<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<Exclude<R, Sink.Sink<E, A>>, E, void> {
  return withScopedFork((fork) =>
    Sink.drain<E, A>().pipe(
      // Run our Fx in the scope
      Effect.tap((drain) => fork(drain.provide(fx))),
      // Wait for the stream to signal completion
      Effect.flatMap((drain) => drain.wait())
    )
  )
}
