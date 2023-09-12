import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as Context from "@typed/context"

export type Provide<R, E, A> =
  | ProvideContext<A>
  | ProvideSomeContext<A>
  | ProvideLayer<R, E, A>
  | ProvideSomeLayer<R, E, A>

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

export function matchProvide<R = never, E = never, A = never, B = never>(
  self: Provide<R, E, A>,
  matchers: {
    readonly ProvideContext: (i0: Context.Context<A>) => B
    readonly ProvideSomeContext: (i0: Context.Context<A>) => B
    readonly ProvideLayer: (i0: Layer.Layer<R, E, A>) => B
    readonly ProvideSomeLayer: (i0: Layer.Layer<R, E, A>) => B
  }
): B {
  return matchers[self._tag](self.i0 as any)
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
        ProvideSomeLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, Layer.succeedContext(a)))
      }),
    ProvideSomeContext: (a) =>
      matchProvide(that, {
        ProvideContext: (b): Provide<R2, E2, A | B> => ProvideSomeContext(Context.merge(a, b)),
        ProvideSomeContext: (b) => ProvideSomeContext(Context.merge(a, b)),
        ProvideLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, Layer.succeedContext(a))),
        ProvideSomeLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, Layer.succeedContext(a)))
      }),
    ProvideLayer: (a) =>
      matchProvide(that, {
        ProvideContext: (b): Provide<Exclude<R, B> | R2, E | E2, A | B> =>
          ProvideLayer(Layer.provideMerge(Layer.succeedContext(b), a)),
        ProvideSomeContext: (b) => ProvideSomeLayer(Layer.provideMerge(Layer.succeedContext(b), a)),
        ProvideLayer: (b) => ProvideLayer(Layer.provideMerge(b, a)),
        ProvideSomeLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, a))
      }),
    ProvideSomeLayer: (a) =>
      matchProvide(that, {
        ProvideContext: (b): Provide<Exclude<R, B> | R2, E | E2, A | B> =>
          ProvideLayer(Layer.provideMerge(Layer.succeedContext(b), a)),
        ProvideSomeContext: (b) => ProvideSomeLayer(Layer.provideMerge(Layer.succeedContext(b), a)),
        ProvideLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, a)),
        ProvideSomeLayer: (b) => ProvideSomeLayer(Layer.provideMerge(b, a))
      })
  })
}

export function provideToEffect<R, E, A, R2 = never, E2 = never, S = never>(
  effect: Effect.Effect<R, E, A>,
  provide: Provide<R2, E2, S>
): Effect.Effect<Exclude<R, S> | R2, E | E2, A> {
  switch (provide._tag) {
    case "ProvideContext":
      return Effect.provideContext(effect as any, provide.i0)
    case "ProvideSomeContext":
      return Effect.provideSomeContext(effect as any, provide.i0)
    case "ProvideLayer":
      return Effect.provideLayer(effect as any, provide.i0)
    case "ProvideSomeLayer":
      return Effect.provideSomeLayer(effect as any, provide.i0)
  }
}
