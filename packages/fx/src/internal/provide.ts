import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as Context from "@typed/context"

// TODO: Need to separate Provide + ProvideSome
export type Provide<R, E, A> = ProvideContext<A> | ProvideLayer<R, E, A>

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

export function merge<R = never, E = never, A = never, R2 = never, E2 = never, B = never>(
  self: Provide<R, E, A>,
  that: Provide<R2, E2, B>
): Provide<Exclude<R, B> | R2, E | E2, A | B> {
  if (self._tag === "ProvideContext") {
    if (that._tag === "ProvideContext") {
      return ProvideContext(Context.merge(self.i0, that.i0))
    } else {
      return ProvideLayer(Layer.provideMerge(that.i0, Layer.succeedContext(self.i0)))
    }
  } else {
    if (that._tag === "ProvideContext") {
      return ProvideLayer(Layer.provideMerge(Layer.succeedContext(that.i0), self.i0))
    } else {
      return ProvideLayer(Layer.provideMerge(that.i0, self.i0))
    }
  }
}

export function provideToEffect<R, E, A, R2, E2, S>(
  effect: Effect.Effect<R, E, A>,
  provide: Provide<R2, E2, S>
): Effect.Effect<Exclude<R, S> | R2, E | E2, A> {
  if (provide._tag === "ProvideContext") {
    return Effect.provideSomeContext(effect, provide.i0)
  } else {
    return Effect.provideSomeLayer(effect, provide.i0)
  }
}
