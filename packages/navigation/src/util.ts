import * as Effect from '@effect/io/Effect'

export function getUrl(href: string, origin: string) {
  return new URL(href, origin)
}

export const createKey = Effect.randomWith((random) =>
  Effect.map(random.nextIntBetween(0, Number.MAX_SAFE_INTEGER), (n) => n.toString(36).slice(2, 10)),
)
