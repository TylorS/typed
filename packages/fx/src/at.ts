import { Fx } from './Fx.js'
import type { Duration } from './externals.js'
import { Effect } from './externals.js'

export function at<A>(value: A, delay: Duration.Duration): Fx<never, never, A> {
  return Fx((sink) => Effect.delay(sink.event(value), delay))
}
