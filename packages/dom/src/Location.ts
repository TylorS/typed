/**
 * Low-level Effect wrappers for Location and its usage via Context.
 * @since 8.19.0
 */

import * as Context from "@typed/context"
import type * as Effect from "effect/Effect"

/**
 * Context for the Location object
 * @since 8.19.0
 * @category models
 */
export interface Location extends globalThis.Location {}

/**
 * Context for the Location object
 * @since 8.19.0
 * @category context
 */
export const Location: Context.Tagged<Location> = Context.Tagged<Location>("@typed/dom/Location")

/**
 * Get the href from the current Location
 * @since 8.19.0
 * @category getters
 */
export const getHref: Effect.Effect<Location, never, string> = Location.with((l) => l.href)

/**
 * Get the origin from the current Location
 * @since 8.19.0
 * @category getters
 */
export const getOrigin: Effect.Effect<Location, never, string> = Location.with((l) => l.origin)

/**
 * Get the protocol from the current Location
 * @since 8.19.0
 * @category getters
 */
export const getProtocol: Effect.Effect<Location, never, string> = Location.with((l) => l.protocol)

/**
 * Get the host from the current Location
 * @since 8.19.0
 * @category getters
 */
export const getHost: Effect.Effect<Location, never, string> = Location.with((l) => l.host)

/**
 * Get the hostname from the current Location
 * @since 8.19.0
 * @category getters
 */
export const getHostname: Effect.Effect<Location, never, string> = Location.with((l) => l.hostname)

/**
 * Get the port from the current Location
 * @since 8.19.0
 * @category getters
 */
export const getPort: Effect.Effect<Location, never, string> = Location.with((l) => l.port)

/**
 * Get the pathname from the current Location
 * @since 8.19.0
 * @category getters
 */
export const getPathname: Effect.Effect<Location, never, string> = Location.with((l) => l.pathname)

/**
 * Get the search params string from the current Location
 * @since 8.19.0
 * @category getters
 */
export const getSearch: Effect.Effect<Location, never, URLSearchParams> = Location.with((l) =>
  new URLSearchParams(l.search)
)

/**
 * Get the hash from the current Location
 * @since 8.19.0
 * @category getters
 */
export const getHash: Effect.Effect<Location, never, string> = Location.with((l) => l.hash)

/**
 * Assign the current URL
 * @since 8.19.0
 * @category actions
 */
export const assign: (url: string) => Effect.Effect<Location, never, void> = (url: string) =>
  Location.with((l) => l.assign(url))

/**
 * Reload the current URL
 * @since 8.19.0
 * @category getters
 */
export const reload: Effect.Effect<Location, never, void> = Location.with((l) => l.reload())

/**
 * Replace the current URL
 * @since 8.19.0
 * @category getters
 */
export const replace: (url: string) => Effect.Effect<Location, never, void> = (url: string) =>
  Location.with((l) => l.replace(url))
