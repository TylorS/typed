import { pipe } from '@effect/data/Function'

import { Fx, Sink } from './Fx.js'
import { Cause, Effect, Fiber, Ref } from './externals.js'
import { fromEffect } from './fromEffect.js'

export function exhaustMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return Fx((sink) =>
    Effect.scoped(
      Effect.gen(function* ($) {
        const ref = yield* $(Ref.make<Fiber.RuntimeFiber<never, void> | void>(void 0))
        const reset = Ref.set(ref, void 0)

        const exhaustMapEvent = (a: A) =>
          Effect.gen(function* ($) {
            const currentFiber = yield* $(Ref.get(ref))

            if (currentFiber) {
              return
            }

            const fiber = yield* $(
              pipe(
                f(a).run(
                  Sink(sink.event, (cause) =>
                    Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                  ),
                ),
                Effect.zipLeft(reset),
                Effect.catchAllCause((cause) =>
                  Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                ),
                Effect.forkScoped,
              ),
            )

            yield* $(Ref.set(ref, fiber))
          })

        yield* $(fx.run(Sink(exhaustMapEvent, sink.error)))

        // Wait for the last fiber to finish
        const fiber = yield* $(Ref.get(ref))

        if (fiber) {
          yield* $(Fiber.join(fiber))
        }
      }),
    ),
  )
}

export function exhaustMapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return exhaustMap(fx, (a) => fromEffect(f(a)))
}

export function exhaust<R, E, R2, E2, B>(fx: Fx<R, E, Fx<R2, E2, B>>): Fx<R | R2, E | E2, B> {
  return exhaustMap(fx, (a) => a)
}

export function exhaustEffect<R, E, R2, E2, B>(
  fx: Fx<R, E, Effect.Effect<R2, E2, B>>,
): Fx<R | R2, E | E2, B> {
  return exhaustMapEffect(fx, (a) => a)
}
