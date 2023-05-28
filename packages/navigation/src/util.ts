import * as Effect from '@effect/io/Effect'
import { pathJoin } from '@typed/path'

import { DestinationKey } from './Navigation.js'

export function getUrl(href: string, base: string, origin: string) {
  const url = new URL(href, origin)

  url.pathname = pathJoin(base, url.pathname)

  return url
}

export const createKey = Effect.randomWith((random) =>
  Effect.map(random.nextIntBetween(0, Number.MAX_SAFE_INTEGER), (n) =>
    DestinationKey(n.toString(36).slice(2, 10)),
  ),
)
