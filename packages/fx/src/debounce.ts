import type { Fx } from './Fx.js'
import type { Duration } from './externals.js'
import { Effect } from './externals.js'
import { switchMapEffect } from './switchMap.js'

export function debounce<R, E, A>(fx: Fx<R, E, A>, duration: Duration.Duration): Fx<R, E, A> {
  return switchMapEffect(fx, (a) => Effect.delay(Effect.succeed(a), duration))
}
