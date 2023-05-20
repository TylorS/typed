import * as Duration from '@effect/data/Duration'
import * as Effect from '@effect/io/Effect'

import { Fx } from './Fx.js'

export function at<A>(value: A, delay: Duration.Duration): Fx<never, never, A> {
  return Fx((sink) => Effect.delay(sink.event(value), delay))
}
