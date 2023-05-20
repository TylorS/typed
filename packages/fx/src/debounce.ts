import * as Duration from '@effect/data/Duration'
import * as Effect from '@effect/io/Effect'

import type { Fx } from './Fx.js'
import { switchMapEffect } from './switchMap.js'

export function debounce<R, E, A>(fx: Fx<R, E, A>, duration: Duration.Duration): Fx<R, E, A> {
  return switchMapEffect(fx, (a) => Effect.delay(Effect.succeed(a), duration))
}
