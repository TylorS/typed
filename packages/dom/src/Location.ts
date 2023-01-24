import type * as Effect from '@effect/io/Effect'
import * as C from '@typed/context'

export interface Location extends globalThis.Location {}
export const Location = C.Tag<Location>('@typed/dom/Location')

export const getHref: Effect.Effect<Location, never, string> = Location.with((l) => l.href)

export const getOrigin = Location.with((l) => l.origin)

export const getProtocol = Location.with((l) => l.protocol)

export const getHost = Location.with((l) => l.host)

export const getHostname = Location.with((l) => l.hostname)

export const getPort = Location.with((l) => l.port)

export const getPathname = Location.with((l) => l.pathname)

export const getSearch = Location.with((l) => l.search)

export const getHash = Location.with((l) => l.hash)

export const assign = (url: string) => Location.with((l) => l.assign(url))

export const reload = Location.with((l) => l.reload())

export const replace = (url: string) => Location.with((l) => l.replace(url))
