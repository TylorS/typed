import type { Duration } from '@effect/data/Duration'

import { Fx, Sink } from '@typed/fx/Fx'
import { Effect } from '@typed/fx/externals'

export function delay<R, E, A>(fx: Fx<R, E, A>, delay: Duration): Fx<R, E, A> {
  return Fx((sink) => fx.run(Sink((a) => Effect.delay(sink.event(a), delay), sink.error)))
}
