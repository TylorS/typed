import { Effect, EffectURI } from '@effect/core/io/Effect'

/**
 * @internal
 */
export function isEffect(u: unknown): u is Effect<any, any, any> {
  return typeof u === 'object' && u !== null && EffectURI in u
}
