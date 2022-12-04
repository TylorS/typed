import * as Duration from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import { getTime } from '@typed/clock'

import { Effect, flatMap, matchCause } from '../Effect.js'

import { Stream } from './Stream.js'

export function fromEffect<R, E, A>(effect: Effect<R, E, A>): Stream<R, E, A> {
  return Stream((sink, scheduler) =>
    scheduler.delay(
      pipe(
        effect,
        matchCause(
          (cause) => sink.error(getTime(scheduler), cause),
          (a) => {
            const time = getTime(scheduler)

            return pipe(
              sink.event(time, a),
              flatMap(() => sink.end(time)),
            )
          },
        ),
      ),
      Duration.zero,
    ),
  )
}
