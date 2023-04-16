import { pipe } from '@effect/data/Function'

import { Fx, Sink } from './Fx.js'
import { Cause, Duration, Effect, Either, Fiber, RefS } from './externals.js'
import { failCause } from './failCause.js'
import { fromEffect } from './fromEffect.js'

export function switchMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return Fx((sink) =>
    Effect.scoped(
      Effect.gen(function* ($) {
        const ref = yield* $(RefS.make<Fiber.RuntimeFiber<never, void> | null>(null))
        const reset = RefS.set(ref, null)

        const switchError = (cause: Cause.Cause<E>) =>
          RefS.updateEffect(ref, (currentFiber) =>
            pipe(
              currentFiber ? Fiber.interruptFork(currentFiber) : Effect.unit(),
              Effect.flatMap(() =>
                pipe(
                  f(cause).run(
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
              ),
            ),
          )

        yield* $(fx.run(Sink(sink.event, switchError)))

        yield* $(Effect.sleep(Duration.millis(0)))

        // Wait for the last fiber to finish
        const fiber = yield* $(RefS.get(ref))

        if (fiber) {
          yield* $(Fiber.join(fiber))
        }
      }),
    ),
  )
}

export function switchMapCauseEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return switchMapCause(fx, (a) => fromEffect(f(a)))
}

export function switchMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return switchMapCause(fx, (cause) =>
    pipe(cause, Cause.failureOrCause, Either.match(f, failCause)),
  )
}

export function switchMapErrorEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return switchMapError(fx, (a) => fromEffect(f(a)))
}
