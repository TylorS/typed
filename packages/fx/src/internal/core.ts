import type * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Scope from "@effect/io/Scope"
import type { Fx } from "@typed/fx/Fx"
import * as FromEffect from "@typed/fx/internal/fromEffect"
import * as Sink from "@typed/fx/Sink"

export const FxTypeId = Symbol.for("@typed/fx/Fx")
export type FxTypeId = typeof FxTypeId

export function make<R, E = never, A = never>(
  effect: Effect.Effect<R | Sink.Error<E> | Sink.Event<A>, never, unknown>
): Fx.WithExclude<R, E, A> {
  return Object.assign(effect, {
    [FxTypeId]: FxTypeId
  }) as Fx.WithExclude<R, E, A>
}

export function makeSuspend<R, E = never, A = never>(
  effect: Effect.Effect<R | Sink.Error<E> | Sink.Event<A>, never, unknown>
): Fx.WithExclude<R, E, A> {
  return make(Effect.suspend(() => effect))
}

export type GenResources<T> = [T] extends [never] ? never
  : [T] extends [Effect.EffectGen<infer R, any, any>] ? R
  : never

export type GenError<T> = [T] extends [never] ? never : [T] extends [Effect.EffectGen<any, infer E, any>] ? E : never

export type Adapter = Effect.Adapter & {
  readonly succeed: <A>(a: A) => Effect.EffectGen<Sink.Event<A>, never, void>
  readonly failCause: <E>(e: Cause.Cause<E>) => Effect.EffectGen<Sink.Error<E>, never, void>
  readonly fail: <E>(e: E) => Effect.EffectGen<Sink.Error<E>, never, void>
}

const adaptersCache = new WeakMap<Effect.Adapter, Adapter>()
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

export const makeGen: <E extends Effect.EffectGen<any, any, any>>(
  f: (adapter: Adapter) => Generator<E, unknown, any>
) => Fx.WithExclude<
  GenResources<E>,
  GenError<E>,
  never
> = (f) =>
  make(
    Effect.catchAllCause(Effect.gen((adapter) => f(Adapter(adapter))), Sink.failCause)
  )

export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): Fx.WithExclude<R, E, A> {
  return make(FromEffect.fromEffect(effect))
}

export function isFx<R, E, A>(value: unknown): value is Fx<R, E, A> {
  return isObject(value) && FxTypeId in value
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function drain<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<Exclude<R, Sink.Sink<E, A>>, E, void> {
  return Effect.asUnit(Effect.acquireUseRelease(
    Scope.make(),
    (scope) =>
      Sink.drain<E, A>().pipe(
        Effect.tap((drain) => Effect.forkIn(drain.provide(fx), scope)),
        Effect.flatMap((drain) => drain.wait())
      ),
    Scope.close
  ))
}
