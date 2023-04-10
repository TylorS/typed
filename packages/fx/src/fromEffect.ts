import { Effect } from './externals.js'

import { Fx } from './Fx.js'

export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> {
  return Fx((sink) => Effect.matchCauseEffect(effect, sink.error, sink.event))
}
