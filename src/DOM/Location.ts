import * as Effect from '@effect/core/io/Effect'
import * as Layer from '@effect/core/io/Layer'
import * as T from '@tsplus/stdlib/service/Tag'

import { getDocument } from './Document.js'

export namespace Location {
  export const Tag: T.Tag<Location> = T.Tag<Location>()
}

export const getLocation: Effect.Effect<Location, never, Location> = Effect.service(Location.Tag)

export const getHref = Effect.serviceWith(Location.Tag, (l) => l.href)

export const getOrigin = Effect.serviceWith(Location.Tag, (l) => l.origin)

export const getProtocol = Effect.serviceWith(Location.Tag, (l) => l.protocol)

export const getHost = Effect.serviceWith(Location.Tag, (l) => l.host)

export const getHostname = Effect.serviceWith(Location.Tag, (l) => l.hostname)

export const getPort = Effect.serviceWith(Location.Tag, (l) => l.port)

export const getPathname = Effect.serviceWith(Location.Tag, (l) => l.pathname)

export const getSearch = Effect.serviceWith(Location.Tag, (l) => l.search)

export const getHash = Effect.serviceWith(Location.Tag, (l) => l.hash)

export const assign = (url: string) => Effect.serviceWith(Location.Tag, (l) => l.assign(url))

export const reload = Effect.serviceWith(Location.Tag, (l) => l.reload())

export const replace = (url: string) => Effect.serviceWith(Location.Tag, (l) => l.replace(url))

export const liveLocation: Layer.Layer<Document, never, Location> = Layer.fromEffect(Location.Tag)(
  Effect.map((d: Document) => d.location)(getDocument),
)
