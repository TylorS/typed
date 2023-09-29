import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as Context from "@typed/context"

export type Provide<R, E, A> =
  | ProvideContext<A>
  | ProvideSomeContext<A>
  | ProvideLayer<R, E, A>
  | ProvideSomeLayer<R, E, A>
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

export interface ProvideSomeContext<A> {
  readonly _tag: "ProvideSomeContext"
  readonly i0: Context.Context<A>
}

export const ProvideSomeContext = <A>(i0: Context.Context<A>): ProvideSomeContext<A> => ({
  _tag: "ProvideSomeContext",
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

export interface ProvideSomeLayer<R, E, A> {
  readonly _tag: "ProvideSomeLayer"
  readonly i0: Layer.Layer<R, E, A>
}

export const ProvideSomeLayer = <R, E, A>(i0: Layer.Layer<R, E, A>): ProvideSomeLayer<R, E, A> => ({
  _tag: "ProvideSomeLayer",
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

export function matchProvide<R = never, E = never, A = never, B = never>(
  self: Provide<R, E, A>,
  matchers: {
    readonly ProvideContext: (i0: Context.Context<A>) => B
    readonly ProvideSomeContext: (i0: Context.Context<A>) => B
    readonly ProvideLayer: (i0: Layer.Layer<R, E, A>) => B
    readonly ProvideSomeLayer: (i0: Layer.Layer<R, E, A>) => B
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
    ProvideContext: (a) =>
      matchProvide(that, {
        ProvideContext: (b): Provide<R2, E2, A | B> => ProvideContext(Context.merge(a, b)),
        ProvideSomeContext: (b) => ProvideSomeContext(Context.merge(a, b)),
        ProvideLayer: (b) => ProvideLayer(Layer.provideMerge(b, Layer.succeedContext(a))),
        ProvideSomeLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, Layer.succeedContext(a))),
        ProvideService: (tag, s) => ProvideContext(Context.add(a, tag, s)),
        ProvideServiceEffect: (tag, effectS) =>
          ProvideSomeLayer(Layer.provideMerge(Layer.effect(tag, effectS), Layer.succeedContext(a)))
      }),
    ProvideSomeContext: (a) =>
      matchProvide(that, {
        ProvideContext: (b): Provide<R2, E2, A | B> => ProvideSomeContext(Context.merge(a, b)),
        ProvideSomeContext: (b) => ProvideSomeContext(Context.merge(a, b)),
        ProvideLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, Layer.succeedContext(a))),
        ProvideSomeLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, Layer.succeedContext(a))),
        ProvideService: (tag, s) => ProvideSomeContext(Context.add(a, tag, s)),
        ProvideServiceEffect: (tag, effectS) =>
          ProvideSomeLayer(Layer.provideMerge(Layer.effect(tag, effectS), Layer.succeedContext(a)))
      }),
    ProvideLayer: (a) =>
      matchProvide(that, {
        ProvideContext: (b): Provide<Exclude<R, B> | R2, E | E2, A | B> =>
          ProvideLayer(Layer.provideMerge(Layer.succeedContext(b), a)),
        ProvideSomeContext: (b) => ProvideSomeLayer(Layer.provideMerge(Layer.succeedContext(b), a)),
        ProvideLayer: (b) => ProvideLayer(Layer.provideMerge(b, a)),
        ProvideSomeLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, a)),
        ProvideService: (tag, s) => ProvideSomeLayer(Layer.provideMerge(Layer.succeedContext(Context.make(tag, s)), a)),
        ProvideServiceEffect: (tag, effectS) => ProvideSomeLayer(Layer.provideMerge(Layer.effect(tag, effectS), a))
      }),
    ProvideSomeLayer: (a) =>
      matchProvide(that, {
        ProvideContext: (b): Provide<Exclude<R, B> | R2, E | E2, A | B> =>
          ProvideLayer(Layer.provideMerge(Layer.succeedContext(b), a)),
        ProvideSomeContext: (b) => ProvideSomeLayer(Layer.provideMerge(Layer.succeedContext(b), a)),
        ProvideLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, a)),
        ProvideSomeLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, a)),
        ProvideService: (tag, s) => ProvideSomeLayer(Layer.provideMerge(Layer.succeedContext(Context.make(tag, s)), a)),
        ProvideServiceEffect: (tag, effectS) => ProvideSomeLayer(Layer.provideMerge(Layer.effect(tag, effectS), a))
      }),
    ProvideService: (tag, s) =>
      matchProvide(that, {
        ProvideContext: (b): Provide<Exclude<R, B> | R2, E | E2, A | B> => ProvideContext(Context.add(b, tag, s)),
        ProvideSomeContext: (b) => ProvideSomeContext(Context.add(b, tag, s)),
        ProvideLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, Layer.succeedContext(Context.make(tag, s)))),
        ProvideSomeLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, Layer.succeedContext(Context.make(tag, s)))),
        ProvideService: (tag2, s2) => ProvideSomeContext(Context.add(Context.make(tag, s), tag2, s2)),
        ProvideServiceEffect: (tag2, effectS) =>
          ProvideSomeLayer(Layer.provideMerge(Layer.effect(tag2, effectS), Layer.succeed(tag, s)))
      }),
    ProvideServiceEffect: (tag, effectS) =>
      matchProvide(that, {
        ProvideContext: (b): Provide<Exclude<R, B> | R2, E | E2, A | B> =>
          ProvideSomeLayer(Layer.provideMerge(Layer.succeedContext(b), Layer.effect(tag, effectS))),
        ProvideSomeContext: (b) =>
          ProvideSomeLayer(Layer.provideMerge(Layer.succeedContext(b), Layer.effect(tag, effectS))),
        ProvideLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, Layer.effect(tag, effectS))),
        ProvideSomeLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, Layer.effect(tag, effectS))),
        ProvideService: (tag2, s) =>
          ProvideSomeLayer(Layer.provideMerge(Layer.succeed(tag2, s), Layer.effect(tag, effectS))),
        ProvideServiceEffect: (tag2, effectS2) =>
          ProvideSomeLayer(Layer.provideMerge(Layer.effect(tag2, effectS2), Layer.effect(tag, effectS)))
      })
  })
}

export function provideToEffect<R, E, A, R2 = never, E2 = never, S = never>(
  effect: Effect.Effect<R, E, A>,
  provide: Provide<R2, E2, S>
): Effect.Effect<Exclude<R, S> | R2, E | E2, A> {
  switch (provide._tag) {
    case "ProvideContext":
    case "ProvideSomeContext":
    case "ProvideLayer":
    case "ProvideSomeLayer":
      return Effect.provide(effect as any, provide.i0 as any)
    case "ProvideService":
      return Effect.provideService(effect as any, provide.i0, provide.i1)
    case "ProvideServiceEffect":
      return Effect.provideServiceEffect(effect as any, provide.i0, provide.i1)
  }
}
