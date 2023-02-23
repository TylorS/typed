import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'
import { withEarlyExit } from '../_internal/earlyExit.js'

import { filter } from './filter.js'

export function since<R2, E2, B>(signal: Fx<R2, E2, B>) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A> => new SinceFx(fx, signal)
}

class SinceFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, A>
  implements Fx<R | R2, E | E2, A>
{
  constructor(readonly fx: Fx<R, E, A>, readonly signal: Fx<R2, E2, B>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A>) {
    const { fx, signal } = this

    return pipe(
      Effect.gen(function* ($) {
        let shouldRun = false

        yield* $(
          pipe(
            withEarlyExit(
              (earlyExit) => signal.run(Fx.Sink(() => earlyExit, sink.error, earlyExit)),
              Effect.sync(() => (shouldRun = true)),
            ),
            Effect.forkScoped,
          ),
        )

        return yield* $(
          pipe(
            fx,
            filter(() => shouldRun),
          ).run(sink),
        )
      }),
    )
  }
}
