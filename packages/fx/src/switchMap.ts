import { pipe } from '@effect/data/Function'

import { Fx, Sink } from './Fx.js'
import { Cause, Effect, Fiber, Runtime } from './externals.js'
import { fromEffect } from './fromEffect.js'

export function switchMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return Fx(<R3>(sink: Sink<R3, E | E2, B>) =>
    Effect.gen(function* ($) {
      const runFork = Runtime.runFork(yield* $(Effect.runtime<R | R2 | R3>()))
      let ref: Fiber.RuntimeFiber<never, void> | undefined

      const switchEvent = (a: A) =>
        Effect.gen(function* ($) {
          if (ref) {
            yield* $(Fiber.interruptFork(ref))
          }

          ref = runFork(
            pipe(
              f(a).run(
                Sink(sink.event, (cause) =>
                  Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                ),
              ),
              Effect.zipLeft(Effect.sync(() => (ref = undefined))),
              Effect.catchAllCause((cause) =>
                Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
              ),
            ),
          )
        })

      yield* $(fx.run(Sink(switchEvent, sink.error)))

      // Wait for the last fiber to finish
      if (ref) {
        yield* $(Fiber.join(ref))
      }
    }),
  )
}

export function switchMapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return switchMap(fx, (a) => fromEffect(f(a)))
}

export function switchLatest<R, E, R2, E2, B>(fx: Fx<R, E, Fx<R2, E2, B>>): Fx<R | R2, E | E2, B> {
  return switchMap(fx, (a) => a)
}

export function switchLatestEffect<R, E, R2, E2, B>(
  fx: Fx<R, E, Effect.Effect<R2, E2, B>>,
): Fx<R | R2, E | E2, B> {
  return switchMapEffect(fx, (a) => a)
}
