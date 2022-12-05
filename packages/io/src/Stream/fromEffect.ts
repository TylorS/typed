import { pipe } from '@fp-ts/data/Function'

import { Effect, flatMap, matchCause } from '../Effect.js'

import { Stream } from './Stream.js'

export function fromEffect<R, E, A>(effect: Effect<R, E, A>): Stream<R, E, A> {
  return Stream((sink, scheduler) =>
    pipe(
      effect,
      matchCause(
        (cause) => sink.error(scheduler.getTime(), cause),
        (a) =>
          pipe(
            sink.event(scheduler.getTime(), a),
            flatMap(() => sink.end(scheduler.getTime())),
          ),
      ),
    ),
  )
}
