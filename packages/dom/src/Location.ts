import type * as Effect from '@effect/io/Effect'
import * as C from '@typed/context'

export interface Location extends globalThis.Location {}
export const Location = C.Tag<Location>('@typed/dom/Location')

export const getHref: Effect.Effect<Location, never, string> = Location.with((l) => l.href)

export const getOrigin: Effect.Effect<Location, never, string> = Location.with((l) => l.origin)

export const getProtocol: Effect.Effect<Location, never, string> = Location.with((l) => l.protocol)

export const getHost: Effect.Effect<Location, never, string> = Location.with((l) => l.host)

export const getHostname: Effect.Effect<Location, never, string> = Location.with((l) => l.hostname)

export const getPort: Effect.Effect<Location, never, string> = Location.with((l) => l.port)

export const getPathname: Effect.Effect<Location, never, string> = Location.with((l) => l.pathname)

export const getSearch: Effect.Effect<Location, never, string> = Location.with((l) => l.search)

export const getHash: Effect.Effect<Location, never, string> = Location.with((l) => l.hash)

export const assign: (url: string) => Effect.Effect<Location, never, void> = (url: string) =>
  Location.with((l) => l.assign(url))

export const reload: Effect.Effect<Location, never, void> = Location.with((l) => l.reload())

export const replace: (url: string) => Effect.Effect<Location, never, void> = (url: string) =>
  Location.with((l) => l.replace(url))
