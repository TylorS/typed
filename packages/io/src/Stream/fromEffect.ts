import { pipe } from '@fp-ts/data/Function'

import { Effect, flatMap, matchCause } from '../Effect.js'

import { Stream } from './Stream.js'

export function fromEffect<R, E, A>(effect: Effect<R, E, A>): Stream<R, E, A> {
  return Stream((sink) =>
    pipe(
      effect,
      matchCause(
        (cause) => sink.error(cause),
        (a) =>
          pipe(
            sink.event(a),
            flatMap(() => sink.end),
          ),
      ),
    ),
  )
}
