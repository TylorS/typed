import type { Duration } from '@effect/data/Duration'
import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'

export function delay<R, E, A>(fx: Fx<R, E, A>, delay: Duration): Fx<R, E, A> {
  return Fx((sink) => fx.run(Sink((a) => Effect.delay(sink.event(a), delay), sink.error)))
}
