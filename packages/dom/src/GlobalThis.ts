/**
 * Low-level Effect wrappers for globalThis and its usage via Context.
 * @since 8.19.0
 */

import * as Context from "@typed/context"
import type * as Effect from "effect/Effect"

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
export const GlobalThis: Context.Tagged<GlobalThis> = Context.Tagged<GlobalThis>("@typed/dom/GlobalThis")

/**
 * Construct a new DOMParser
 * @since 8.19.0
 */
export const makeDOMParser: Effect.Effect<globalThis.DOMParser, never, GlobalThis> = GlobalThis.with((globalThis) =>
  new globalThis.DOMParser()
)
