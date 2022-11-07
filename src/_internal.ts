import { Effect, EffectURI } from '@effect/core/io/Effect'
import * as Fx from '@typed/fx'

/**
 * @internal
 */
export function isEffect<R, E>(u: unknown): u is Effect<R, E, any> {
  return typeof u === 'object' && u !== null && EffectURI in u
}

/**
 * @internal
 */
export function isFx<R, E>(u: unknown): u is Fx.Fx<R, E, any> {
  return (
    typeof u === 'object' &&
    u !== null &&
    'run' in u &&
    typeof (u as Fx.Fx<any, any, any>).run === 'function'
  )
}
