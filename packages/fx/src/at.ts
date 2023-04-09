import { Fx } from '@typed/fx/Fx'
import type { Duration } from '@typed/fx/externals'
import { Effect } from '@typed/fx/externals'

export function at<A>(value: A, delay: Duration.Duration): Fx<never, never, A> {
  return Fx((sink) => Effect.delay(sink.event(value), delay))
}
