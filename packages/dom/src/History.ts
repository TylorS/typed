/**
 * Low-level Effect wrappers for History and its usage via Context.
 * @since 8.19.0
 */

import * as Effect from "@effect/io/Effect"
import * as C from "@typed/context"

/**
 * A Context for the History object
 * @since 8.19.0
 * @category models
 */
export interface History extends globalThis.History {}

/**
 * A Context for the globalThis object
 * @since 8.19.0
 * @category context
 */
export const History: C.Tagged<History, History> = C.Tagged<History>("@typed/dom/History")

/**
 * Call pushState on the History object
 * @since 8.19.0
 * @category actions
 */
export const pushState: (
  url: string | URL,
  data?: unknown
) => Effect.Effect<History, never, void> = (url: string | URL, data?: unknown) =>
  History.with((h) => h.pushState(data, "", url))

/**
 * Call replaceState on the History object
 * @since 8.19.0
 * @category actions
 */
export const replaceState: (
  url: string | URL,
  data?: unknown
) => Effect.Effect<History, never, void> = (url: string | URL, data?: unknown) =>
  History.with((h) => h.replaceState(data, "", url))

/**
 * get the current state from the History object
 * @since 8.19.0
 * @category actions
 */
export const getState: Effect.Effect<History, never, unknown> = History.with(
  (h) => h.state as unknown
)

/**
 * Navigate to a delta in the history
 * @since 8.19.0
 * @category actions
 */
export const go: (delta: number) => Effect.Effect<History, never, void> = (delta: number) =>
  History.with((h) => h.go(delta))

/**
 * Go back in the history
 * @since 8.19.0
 * @category actions
 */
export const back: Effect.Effect<History, never, void> = History.with((h) => h.back())

/**
 * Go forward in the history
 * @since 8.19.0
 * @category actions
 */
export const forward: Effect.Effect<History, never, void> = History.with((h) => h.forward())

/**
 * Get the number of history entries
 * @since 8.19.0
 * @category actions
 */
export const getLength: Effect.Effect<History, never, number> = History.with((h) => h.length)

/**
 * Get the current scroll restoration behavior
 * @since 8.19.0
 * @category actions
 */
export const getScrollRestoration: Effect.Effect<History, never, ScrollRestoration> = History.with(
  (h) => h.scrollRestoration
)

/**
 * Set the current scroll restoration behavior
 * @since 8.19.0
 * @category actions
 */
export const setScrollRestoration: (
  scrollRestoration: ScrollRestoration
) => Effect.Effect<History, never, void> = (scrollRestoration: ScrollRestoration) =>
  Effect.asUnit(History.with((h) => (h.scrollRestoration = scrollRestoration)))

/**
 * Get the current scroll restoration behavior to "auto"
 * @since 8.19.0
 * @category actions
 */
export const setAutoScrollRestoration: Effect.Effect<History, never, void> = setScrollRestoration("auto")

/**
 * Get the current scroll restoration behavior to "manual"
 * @since 8.19.0
 * @category actions
 */
export const setManualScrollRestoration: Effect.Effect<History, never, void> = setScrollRestoration("manual")
