import { Effect, EffectURI } from '@effect/core/io/Effect'
import * as Fx from '@typed/fx'

import { isElementRef } from './HTML/ElementRef.js'

/**
 * @internal
 */
export function isEffect<R, E>(u: unknown): u is Effect<R, E, any> {
  return isObject(u) && EffectURI in u
}

/**
 * @internal
 */
export function isFx<R, E>(u: unknown): u is Fx.Fx<R, E, any> {
  return (
    isObject(u) &&
    !isElementRef(u) &&
    'run' in u &&
    typeof (u as Fx.Fx<any, any, any>).run === 'function'
  )
}

function isObject(u: unknown): u is object {
  return typeof u === 'object' && u !== null
}
