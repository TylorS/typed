import type * as Context from "@typed/context"
import { Effect, FiberRefsPatch, Layer, Runtime, RuntimeFlags } from "effect"
import type { Scope } from "effect"

export type Provide<R, E, A> =
  | ProvideContext<A>
  | ProvideLayer<R, E, A>
  | ProvideRuntime<A>
  | ProvideService<A, any>
  | ProvideServiceEffect<R, E, A, any>

export interface ProvideContext<A> {
  readonly _tag: "ProvideContext"
  readonly i0: Context.Context<A>
}

export const ProvideContext = <A>(i0: Context.Context<A>): ProvideContext<A> => ({
  _tag: "ProvideContext",
  i0
})

export interface ProvideLayer<R, E, A> {
  readonly _tag: "ProvideLayer"
  readonly i0: Layer.Layer<R, E, A>
}

export const ProvideLayer = <R, E, A>(i0: Layer.Layer<R, E, A>): ProvideLayer<R, E, A> => ({
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

export interface ProvideServiceEffect<R, E, I, S> {
  readonly _tag: "ProvideServiceEffect"
  readonly i0: Context.Tag<I, S>
  readonly i1: Effect.Effect<R, E, S>
}

export const ProvideServiceEffect = <R, E, I, S>(
  i0: Context.Tag<I, S>,
  i1: Effect.Effect<R, E, S>
): ProvideServiceEffect<R, E, I, S> => ({
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

export function matchProvide<R = never, E = never, A = never, B = never>(
  self: Provide<R, E, A>,
  matchers: {
    readonly ProvideContext: (i0: Context.Context<A>) => B
    readonly ProvideRuntime: (i0: Runtime.Runtime<A>) => B
    readonly ProvideLayer: (i0: Layer.Layer<R, E, A>) => B
    readonly ProvideService: (tag: Context.Tag<A, any>, service: any) => B
    readonly ProvideServiceEffect: (tag: Context.Tag<A, any>, service: Effect.Effect<R, E, any>) => B
  }
): B {
  return matchers[self._tag](self.i0 as any, (self as any).i1)
}

export function merge<R = never, E = never, A = never, R2 = never, E2 = never, B = never>(
  self: Provide<R, E, A>,
  that: Provide<R2, E2, B>
): Provide<Exclude<R, B> | R2, E | E2, A | B> {
  return ProvideLayer(Layer.provideMerge(toLayer(self), toLayer(that)))
}

export function buildWithScope<R, E, A>(
  provide: Provide<R, E, A>,
  scope: Scope.Scope
) {
  return Layer.buildWithScope(toLayer(provide), scope)
}

export function toLayer<R, E, A>(provide: Provide<R, E, A>): Layer.Layer<R, E, A> {
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

export function provideToEffect<R, E, A, R2 = never, E2 = never, S = never>(
  effect: Effect.Effect<R, E, A>,
  provide: Provide<R2, E2, S>
): Effect.Effect<Exclude<R, S> | R2, E | E2, A> {
  return Effect.provide(effect, toLayer(provide))
}

function runtimeToLayer<R>(runtime: Runtime.Runtime<R>): Layer.Layer<never, never, R> {
  // Calculate patch
  const patchRefs = FiberRefsPatch.diff(Runtime.defaultRuntime.fiberRefs, runtime.fiberRefs)
  const patchFlags = RuntimeFlags.diff(Runtime.defaultRuntime.runtimeFlags, runtime.runtimeFlags)

  return Layer.scopedContext(
    Effect.gen(function*(_) {
      const oldRefs = yield* _(Effect.getFiberRefs)
      const oldFlags = yield* _(Effect.getRuntimeFlags)

      // Patch
      yield* _(Effect.patchFiberRefs(patchRefs))
      yield* _(Effect.patchRuntimeFlags(patchFlags))

      const newRefs = yield* _(Effect.getFiberRefs)
      const newFlags = yield* _(Effect.getRuntimeFlags)

      // Calculate rollback
      const rollbackRefs = FiberRefsPatch.diff(newRefs, oldRefs)
      const rollbackFlags = RuntimeFlags.diff(newFlags, oldFlags)

      // Rollback when scope is closed
      yield* _(
        Effect.addFinalizer(() =>
          Effect.zipRight(Effect.patchFiberRefs(rollbackRefs), Effect.patchRuntimeFlags(rollbackFlags))
        )
      )

      return runtime.context
    })
  )
}
