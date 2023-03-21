import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'

import { Fx } from '../Fx.js'
import { asap } from '../_internal/RefCounter.js'
import { withEarlyExit } from '../_internal/earlyExit.js'

import { filter } from './filter.js'

export function during<R2, E2, R3, E3, B>(signal: Fx<R2, E2, Fx<R3, E3, B>>) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R | R2 | R3, E | E2 | E3, A> => new DuringFx(fx, signal)
}

class DuringFx<R, E, A, R2, E2, R3, E3, B>
  extends Fx.Variance<R | R2 | R3, E | E2 | E3, A>
  implements Fx<R | R2 | R3, E | E2 | E3, A>
{
  constructor(readonly fx: Fx<R, E, A>, readonly signal: Fx<R2, E2, Fx<R3, E3, B>>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A>) {
    const { fx, signal } = this

    return withEarlyExit(
      (earlyExit) =>
        Effect.gen(function* ($) {
          let shouldRun = false

          const fiber = yield* $(
            Effect.scheduleForked(asap)(
              pipe(
                fx,
                filter(() => shouldRun),
              ).run(sink),
            ),
          )

          const signalFiber = yield* $(
            Effect.forkScoped(
              signal.run(
                Fx.Sink(
                  (endSignal) =>
                    Effect.suspend(() => {
                      shouldRun = true

                      return endSignal.run(Fx.Sink(() => earlyExit, sink.error, earlyExit))
                    }),
                  sink.error,
                  earlyExit,
                ),
              ),
            ),
          )

          yield* $(Fiber.joinAll([fiber, signalFiber]))
        }),
      sink.end,
    )
  }
}
