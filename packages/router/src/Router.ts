import * as Layer from "effect/Layer";
import { fromWindow } from "@typed/navigation/fromWindow";
import {
  initialMemory,
  type InitialMemoryOptions,
  memory,
  type MemoryOptions,
} from "@typed/navigation/memory";
import type { NavigationError } from "@typed/navigation/model";
import type { Navigation } from "@typed/navigation/Navigation";
import { CurrentRoute } from "./CurrentRoute.js";
import { Uuid7State } from "@typed/id/Uuid7";

/**
 * The service requirements shared by every Typed router runtime.
 *
 * @remarks
 * ## Why
 * Matching requires both a live Navigation backend and a stable CurrentRoute mount boundary.
 *
 * ## Ownership and lifetime
 * This union is type-only. The selected provider Layer owns both services and their scopes.
 *
 * @since 1.0.0
 * @category Router requirements
 */
export type Router = CurrentRoute | Navigation;

/**
 * Builds a browser Router Layer over the platform History API.
 *
 * @remarks
 * ## Why
 * Browser programs receive the same Router contract as SSR and tests while preserving native history
 * and `popstate` as the platform authority.
 *
 * ## Ownership and lifetime
 * Layer acquisition installs the Navigation listener, provides random Uuid7State, and creates the root
 * CurrentRoute. Layer release removes listeners and finalizes scoped registrations. Browser/history
 * failures surface as `NavigationError`.
 *
 * @example
 * ```ts
 * import * as Router from "@typed/router"
 * import { Navigation } from "@typed/navigation/Navigation"
 * import * as Effect from "effect/Effect"
 *
 * const currentUrl = Effect.map(Navigation.currentEntry, ({ url }) => url)
 * const program = Effect.provide(currentUrl, Router.BrowserRouter(window))
 * ```
 *
 * @since 1.0.0
 * @category Runtime providers
 */
export const BrowserRouter = (window?: Window): Layer.Layer<Router, NavigationError> =>
  CurrentRoute.Default.pipe(
    Layer.provideMerge(fromWindow(window)),
    Layer.provideMerge(Uuid7State.Default),
  );

/**
 * Builds an SSR Router Layer from an in-memory history snapshot or initial URL.
 *
 * @remarks
 * ## Why
 * Server rendering can run the exact matcher program without evaluating browser globals.
 *
 * ## Ownership and lifetime
 * Layer acquisition owns memory history, random Uuid7State, and the root CurrentRoute until the Layer Scope
 * closes. Identifier and navigation failures remain in `NavigationError`.
 *
 * @example
 * ```ts
 * import * as Router from "@typed/router"
 *
 * const RouterLive = Router.ServerRouter({ url: "https://example.com/products" })
 * ```
 *
 * @since 1.0.0
 * @category Runtime providers
 */
export const ServerRouter = (
  options: MemoryOptions | InitialMemoryOptions,
): Layer.Layer<Router, NavigationError> =>
  CurrentRoute.Default.pipe(
    Layer.provideMerge("url" in options ? initialMemory(options) : memory(options)),
    Layer.provideMerge(Uuid7State.Default),
  );
