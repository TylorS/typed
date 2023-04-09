import { Effect } from './externals.js'

import { Fx } from '@typed/fx/Fx'

export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> {
  return Fx((sink) => Effect.matchCauseEffect(effect, sink.error, sink.event))
}
