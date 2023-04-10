import type { Duration } from '@effect/data/Duration'

import { Fx, Sink } from './Fx.js'
import { Effect } from './externals.js'

export function delay<R, E, A>(fx: Fx<R, E, A>, delay: Duration): Fx<R, E, A> {
  return Fx((sink) => fx.run(Sink((a) => Effect.delay(sink.event(a), delay), sink.error)))
}
