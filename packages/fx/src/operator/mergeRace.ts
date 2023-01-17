import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { tap } from './tap.js'

/**
 * Merges two streams into one until the first stream emits. This is useful for
 * creating loading screens which you only want to emit after giving a grace period
 * to load data before showing the loading screen to avoid flashes of loading.
 */
export function mergeRace<R2, E2, B>(raced: Fx<R2, E2, B>) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A | B> =>
    Fx((sink) =>
      Effect.gen(function* ($) {
        let interrupted = false
        const racedFiber = yield* $(
          pipe(
            raced.run(Fx.Sink(sink.event, sink.error, Effect.unit())),
            Effect.onError((cause) =>
              Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
            ),
            Effect.forkScoped,
          ),
        )

        return yield* $(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          tap((_: A) =>
            interrupted ? Effect.unit() : ((interrupted = true), Fiber.interruptFork(racedFiber)),
          )(fx).run(sink),
        )
      }),
    )
}
