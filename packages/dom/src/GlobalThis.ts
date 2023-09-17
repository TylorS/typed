/**
 * Low-level Effect wrappers for globalThis and its usage via Context.
 * @since 8.19.0
 */

import type * as Effect from "@effect/io/Effect"
import * as C from "@typed/context"

type Identity<A> = A

/**
 * A Context for the globalThis object
 * @since 8.19.0
 * @category models
 */
export interface GlobalThis extends Identity<typeof globalThis> {}

/**
 * A Context for the globalThis object
 * @since 8.19.0
 * @category context
 */
export const GlobalThis: C.Tag<GlobalThis> & C.Tagged<GlobalThis> = C.Tag<GlobalThis>("@typed/dom/GlobalThis").pipe(
  C.tagged
)

/**
 * Construct a new DOMParser
 * @since 8.19.0
 */
export const makeDOMParser: Effect.Effect<GlobalThis, never, globalThis.DOMParser> = GlobalThis.with((globalThis) =>
  new globalThis.DOMParser()
)
