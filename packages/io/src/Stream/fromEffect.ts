import { Effect } from '../Effect.js'

import { Stream } from './Stream.js'

export function fromEffect<R, E, A>(effect: Effect<R, E, A>): Stream<R, E, A> {
  return Stream((sink) =>
    effect.matchCause(
      (cause) => sink.error(cause),
      (a) => sink.event(a).flatMap(() => sink.end),
    ),
  )
}
