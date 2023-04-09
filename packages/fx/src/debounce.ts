import type { Fx } from '@typed/fx/Fx'
import type { Duration } from '@typed/fx/externals'
import { Effect } from '@typed/fx/externals'
import { switchMapEffect } from '@typed/fx/switchMap'

export function debounce<R, E, A>(fx: Fx<R, E, A>, duration: Duration.Duration): Fx<R, E, A> {
  return switchMapEffect(fx, (a) => Effect.delay(Effect.succeed(a), duration))
}
