import type * as Effect from "@effect/io/Effect"

import type { ContextBuilder } from "./Builder"

export interface Tagged<I, S> {
  /**
   * Apply a function to the service in the environment
   */
  readonly with: <A>(f: (s: S) => A) => Effect.Effect<I, never, A>
  /**
   * Perform an Effect with the service in the environment
   */
  readonly withEffect: <R, E, A>(f: (s: S) => Effect.Effect<R, E, A>) => Effect.Effect<R | I, E, A>

  /**
   * Create a ContextBuilder from the service
   */
  readonly build: (s: S) => ContextBuilder<I>
}
