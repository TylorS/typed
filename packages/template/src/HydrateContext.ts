import * as Context from "effect/Context";
import { getHydrationRoot, type HydrationNode } from "./internal/hydration.js";

/**
 * Advanced renderer state describing the current hydration range.
 *
 * @remarks
 * ## Why
 *
 * The DOM renderer passes marker position and keyed-list identity through an
 * Effect service instead of a hidden component tree. It is published for
 * renderer authors but is not normal application state.
 *
 * ## Ownership and lifetime
 *
 * A render Scope owns the referenced hydration cursor. Consumers must not retain
 * or mutate it after that Scope closes.
 *
 * @example
 * ```ts
 * import type { HydrateContext } from "@typed/template/HydrateContext"
 *
 * declare const context: HydrateContext
 * context.where
 * ```
 *
 * @since 1.0.0
 * @category Hydration context
 * @stability internal-but-published
 */
export type HydrateContext = {
  readonly where: HydrationNode;

  // Used to match sibling components using many() to the correct elements
  readonly manyKey?: string;

  /**@internal */
  hydrate: boolean;
};

/**
 * The Effect service carrying advanced hydration state.
 *
 * @remarks
 * ## Why
 *
 * A service makes hydration explicit in the `R` channel and allows normal
 * Effect provisioning instead of ambient renderer globals.
 *
 * ## Ownership and lifetime
 *
 * The service value is scoped to the render that provides it. The tag itself is
 * process-global metadata and acquires nothing.
 *
 * @example
 * ```ts
 * import { HydrateContext } from "@typed/template/HydrateContext"
 * import { Effect } from "effect"
 *
 * const current = Effect.gen(function* () {
 *   return (yield* HydrateContext).where
 * })
 * ```
 *
 * @since 1.0.0
 * @category Hydration context
 * @stability internal-but-published
 */
export const HydrateContext = Context.Service<HydrateContext>("@typed/html/HydrateContext");

/**
 * Creates a hydration context starting from a root element.
 *
 * This context allows the renderer to "attach" to existing DOM nodes (SSR output)
 * instead of creating new ones.
 *
 * @remarks
 * ## Why
 *
 * Hydration is an opt-in context derived from Typed's versioned boundary
 * markers. If `rootElement` is not a compatible hydration root, this function
 * returns `Context.empty()` so DOM rendering performs a fresh construction; it
 * does not promise to adopt arbitrary markup or sanitize it.
 *
 * ## Ownership and lifetime
 *
 * The returned Context only describes the starting cursor. The Scope running
 * `render` owns adopted-node updates, listeners, subscriptions, and cleanup.
 * Existing DOM identity is preserved only for successfully matched ranges.
 *
 * @example
 * ```ts
 * import { makeHydrateContext } from "@typed/template/HydrateContext"
 *
 * const services = makeHydrateContext(document.querySelector("#app")!)
 * ```
 *
 * @param rootElement - The root DOM element where hydration should begin.
 * @returns A `ServiceMap` containing the `HydrateContext`.
 * @since 1.0.0
 * @category Hydration context
 */
export const makeHydrateContext = (rootElement: HTMLElement): Context.Context<never> => {
  try {
    const where = getHydrationRoot(rootElement);
    return HydrateContext.context({ where, hydrate: true });
  } catch {
    return Context.empty();
  }
};
