import type * as Effect from "@effect/io/Effect"
import type * as Layer from "@effect/io/Layer"
import type * as Scope from "@effect/io/Scope"

import type { ContextBuilder } from "./Builder"

export interface Tagged<I, S> extends Actions<I, S>, Provide<I, S>, Layers<I, S>, Builder<I, S> {}

export interface Actions<I, S> {
  /**
   * Apply a function to the service in the environment
   */
  readonly with: <A>(f: (s: S) => A) => Effect.Effect<I, never, A>
  /**
   * Perform an Effect with the service in the environment
   */
  readonly withEffect: <R, E, A>(f: (s: S) => Effect.Effect<R, E, A>) => Effect.Effect<R | I, E, A>
}

export interface Provide<I, S> {
  /**
   * Provide the service to an Effect
   */
  readonly provide: (
    s: S
  ) => <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<Exclude<R, I>, E, A>
}

export interface Layers<I, S> {
  /**
   * Create a Layer using an Effect
   */
  readonly layer: <R, E>(effect: Effect.Effect<R, E, S>) => Layer.Layer<R, E, I>

  /**
   * Create a Layer using a Scoped Effect
   */
  readonly layerScoped: <R, E>(
    effect: Effect.Effect<R, E, S>
  ) => Layer.Layer<Exclude<R, Scope.Scope>, E, I>

  /**
   * Create a Layer from the service
   */
  readonly layerOf: (s: S) => Layer.Layer<never, never, I>
}

export interface Builder<I, S> {
  readonly build: (s: S) => ContextBuilder<I>
}
