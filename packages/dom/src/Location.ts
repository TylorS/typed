import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as T from '@fp-ts/data/Context'
import * as Fx from '@typed/fx'

import { Document } from './Document.js'

export interface Location extends globalThis.Location {}

export namespace Location {
  export const Tag: T.Tag<Location> = T.Tag<Location>()

  export const access = Effect.serviceWith(Tag)
  export const accessEffect = Effect.serviceWithEffect(Tag)
  export const accessFx = Fx.serviceWithFx(Tag)

  export const provide = Effect.provideService(Tag)
}

export const getLocation: Effect.Effect<Location, never, Location> = Effect.service(Location.Tag)

export const getHref = Location.access((l) => l.href)

export const getOrigin = Location.access((l) => l.origin)

export const getProtocol = Location.access((l) => l.protocol)

export const getHost = Location.access((l) => l.host)

export const getHostname = Location.access((l) => l.hostname)

export const getPort = Location.access((l) => l.port)

export const getPathname = Location.access((l) => l.pathname)

export const getSearch = Location.access((l) => l.search)

export const getHash = Location.access((l) => l.hash)

export const assign = (url: string) => Location.access((l) => l.assign(url))

export const reload = Location.access((l) => l.reload())

export const replace = (url: string) => Location.access((l) => l.replace(url))

export const liveLocation: Layer.Layer<Document, never, Location> = Layer.fromEffect(Location.Tag)(
  Document.access((d) => d.location),
)
