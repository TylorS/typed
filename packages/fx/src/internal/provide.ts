import type * as Context from "@typed/context"
import { Effect, FiberRefsPatch, Layer, Runtime, RuntimeFlags } from "effect"

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
  return matchProvide(self, {
    ProvideContext: (a) => mergeLayer(Layer.succeedContext(a), that),
    ProvideLayer: (a) => mergeLayer(a, that),
    ProvideRuntime: (a) => mergeLayer(runtimeToLayer(a), that),
    ProvideService: (tag, service) => mergeLayer(Layer.succeed(tag, service), that),
    ProvideServiceEffect: (tag, service) => mergeLayer(Layer.effect(tag, service), that)
  })
}

function mergeLayer<R, E, A, R2, E2, B>(
  layer: Layer.Layer<R, E, A>,
  provide: Provide<R2, E2, B>
): Provide<Exclude<R, B> | R2, E | E2, A | B> {
  return matchProvide(provide, {
    ProvideContext: (ctx) => ProvideLayer(Layer.provideMerge(Layer.succeedContext(ctx), layer)),
    ProvideLayer: (layerB) => ProvideLayer(Layer.provideMerge(layerB, layer)),
    ProvideRuntime: (runtime) => ProvideLayer(Layer.provideMerge(runtimeToLayer(runtime), layer)),
    ProvideService: (tag, service) => ProvideLayer(Layer.provideMerge(Layer.succeed(tag, service), layer)),
    ProvideServiceEffect: (tag, service) => ProvideLayer(Layer.provideMerge(Layer.effect(tag, service), layer))
  })
}

export function provideToEffect<R, E, A, R2 = never, E2 = never, S = never>(
  effect: Effect.Effect<R, E, A>,
  provide: Provide<R2, E2, S>
): Effect.Effect<Exclude<R, S> | R2, E | E2, A> {
  switch (provide._tag) {
    case "ProvideContext":
    case "ProvideLayer":
    case "ProvideRuntime":
      return Effect.provide(effect, provide.i0 as Layer.Layer<R2, E2, S>)
    case "ProvideService":
      return Effect.provideService(effect, provide.i0, provide.i1)
    case "ProvideServiceEffect":
      return Effect.provideServiceEffect(effect, provide.i0, provide.i1)
  }
}

function runtimeToLayer<R>(runtime: Runtime.Runtime<R>): Layer.Layer<never, never, R> {
  const patchFlags = RuntimeFlags.diff(Runtime.defaultRuntime.runtimeFlags, runtime.runtimeFlags)
  const inversePatchFlags = RuntimeFlags.diff(runtime.runtimeFlags, Runtime.defaultRuntime.runtimeFlags)
  const patchRefs = FiberRefsPatch.diff(Runtime.defaultRuntime.fiberRefs, runtime.fiberRefs)
  const inversePatchRefs = FiberRefsPatch.diff(runtime.fiberRefs, Runtime.defaultRuntime.fiberRefs)

  return Layer.scopedContext(
    Effect.acquireUseRelease(
      Effect.flatMap(
        Effect.patchRuntimeFlags(patchFlags),
        () => Effect.patchFiberRefs(patchRefs)
      ),
      () => Effect.succeed(runtime.context),
      () =>
        Effect.flatMap(
          Effect.patchRuntimeFlags(inversePatchFlags),
          () => Effect.patchFiberRefs(inversePatchRefs)
        )
    )
  )
}
