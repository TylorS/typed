import type * as Context from "@typed/context"
import * as Effect from "effect/Effect"
import * as FiberRefsPatch from "effect/FiberRefsPatch"
import * as Layer from "effect/Layer"
import * as Runtime from "effect/Runtime"
import * as RuntimeFlags from "effect/RuntimeFlags"
import type * as Scope from "effect/Scope"

export type Provide<A, E, R> =
  | ProvideContext<A>
  | ProvideLayer<A, E, R>
  | ProvideRuntime<A>
  | ProvideService<A, any>
  | ProvideServiceEffect<A, any, E, R>

export interface ProvideContext<A> {
  readonly _tag: "ProvideContext"
  readonly i0: Context.Context<A>
}

export const ProvideContext = <A>(i0: Context.Context<A>): ProvideContext<A> => ({
  _tag: "ProvideContext",
  i0
})

export interface ProvideLayer<A, E, R> {
  readonly _tag: "ProvideLayer"
  readonly i0: Layer.Layer<A, E, R>
}

export const ProvideLayer = <A, E, R>(i0: Layer.Layer<A, E, R>): ProvideLayer<A, E, R> => ({
  _tag: "ProvideLayer",
  i0
})

export interface ProvideService<I, S> {
  readonly _tag: "ProvideService"
  readonly i0: Context.Tag<I, S>
  readonly i1: S
}

export const ProvideService = <I, S>(i0: Context.Tag<I, S>, i1: S): ProvideService<I, S> => ({
  _tag: "ProvideService",
  i0,
  i1
})

export interface ProvideServiceEffect<I, S, E, R> {
  readonly _tag: "ProvideServiceEffect"
  readonly i0: Context.Tag<I, S>
  readonly i1: Effect.Effect<S, E, R>
}

export const ProvideServiceEffect = <I, S, E, R>(
  i0: Context.Tag<I, S>,
  i1: Effect.Effect<S, E, R>
): ProvideServiceEffect<I, S, E, R> => ({
  _tag: "ProvideServiceEffect",
  i0,
  i1
})

export interface ProvideRuntime<A> {
  readonly _tag: "ProvideRuntime"
  readonly i0: Runtime.Runtime<A>
}

export const ProvideRuntime = <A>(i0: Runtime.Runtime<A>): ProvideRuntime<A> => ({
  _tag: "ProvideRuntime",
  i0
})

export function matchProvide<A, E, R, B>(
  self: Provide<A, E, R>,
  matchers: {
    readonly ProvideContext: (i0: Context.Context<A>) => B
    readonly ProvideRuntime: (i0: Runtime.Runtime<A>) => B
    readonly ProvideLayer: (i0: Layer.Layer<A, E, R>) => B
    readonly ProvideService: (tag: Context.Tag<A, any>, service: any) => B
    readonly ProvideServiceEffect: (tag: Context.Tag<A, any>, service: Effect.Effect<any, E, R>) => B
  }
): B {
  return matchers[self._tag](self.i0 as any, (self as any).i1)
}

export function merge<A, E, R, B, E2, R2>(
  self: Provide<A, E, R>,
  that: Provide<B, E2, R2>
): Provide<A | B, E | E2, Exclude<R, B> | R2> {
  return ProvideLayer(Layer.provideMerge(toLayer(self), toLayer(that)))
}

export function buildWithScope<A, E, R>(
  provide: Provide<A, E, R>,
  scope: Scope.Scope
) {
  return Layer.buildWithScope(toLayer(provide), scope)
}

export function toLayer<A, E, R>(provide: Provide<A, E, R>): Layer.Layer<A, E, R> {
  switch (provide._tag) {
    case "ProvideContext":
      return Layer.succeedContext(provide.i0)
    case "ProvideLayer":
      return provide.i0
    case "ProvideRuntime":
      return runtimeToLayer(provide.i0)
    case "ProvideService":
      return Layer.succeed(provide.i0, provide.i1)
    case "ProvideServiceEffect":
      return Layer.effect(provide.i0, provide.i1)
  }
}

export function provideToEffect<A, E, R, R2 = never, E2 = never, S = never>(
  effect: Effect.Effect<A, E, R>,
  provide: Provide<S, E, R2>
): Effect.Effect<A, E | E2, Exclude<R, S> | R2> {
  return Effect.provide(effect, toLayer(provide))
}

export function runtimeToLayer<R>(runtime: Runtime.Runtime<R>): Layer.Layer<R> {
  // Calculate patch
  const patchRefs = FiberRefsPatch.diff(Runtime.defaultRuntime.fiberRefs, runtime.fiberRefs)
  const patchFlags = RuntimeFlags.diff(Runtime.defaultRuntime.runtimeFlags, runtime.runtimeFlags)

  return Layer.scopedContext(
    Effect.Do.pipe(
      // Get Current Refs + Flags
      Effect.bind("oldRefs", () => Effect.getFiberRefs),
      Effect.bind("oldFlags", () => Effect.getRuntimeFlags),
      // Patch Refs + Flags
      Effect.tap(() => Effect.patchFiberRefs(patchRefs)),
      Effect.tap(() => Effect.patchRuntimeFlags(patchFlags)),
      // Get the new Refs + Flags
      Effect.bind("newRefs", () => Effect.getFiberRefs),
      Effect.bind("newFlags", () => Effect.getRuntimeFlags),
      // Calculate rollback patch
      Effect.let("rollbackRefs", ({ newRefs, oldRefs }) => FiberRefsPatch.diff(newRefs, oldRefs)),
      Effect.let("rollbackFlags", ({ newFlags, oldFlags }) => RuntimeFlags.diff(newFlags, oldFlags)),
      // Apply the rollbacks when the current scope is closed
      Effect.tap(({ rollbackFlags, rollbackRefs }) =>
        Effect.addFinalizer(() =>
          Effect.zipRight(Effect.patchFiberRefs(rollbackRefs), Effect.patchRuntimeFlags(rollbackFlags))
        )
      ),
      // Provide the runtime's context
      Effect.map(() => runtime.context)
    )
  )
}
