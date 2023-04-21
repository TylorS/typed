import { pipe } from '@effect/data/Function'

import { Fx, Sink } from './Fx.js'
import { Cause, Effect, Either, Fiber, RefS, Runtime } from './externals.js'
import { failCause } from './failCause.js'
import { fromEffect } from './fromEffect.js'

export function switchMatchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return Fx(<R4>(sink: Sink<R4, E2 | E3, B | C>) =>
    Effect.gen(function* ($) {
      const runFork = Runtime.runFork(yield* $(Effect.runtime<R | R2 | R3 | R4>()))
      const ref = yield* $(RefS.make<Fiber.RuntimeFiber<never, void> | null>(null))
      const reset = RefS.set(ref, null)

      const switchWith = (f: () => Fx<R2 | R3, E2 | E3, B | C>) =>
        RefS.updateEffect(ref, (currentFiber) =>
          pipe(
            currentFiber ? Fiber.interrupt(currentFiber) : Effect.unit(),
            Effect.map(() =>
              pipe(
                f().run(
                  Sink(sink.event, (cause) =>
                    Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                  ),
                ),
                Effect.zipLeft(reset),
                Effect.catchAllCause((cause) =>
                  Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                ),
                runFork,
              ),
            ),
          ),
        )

      yield* $(
        fx.run(
          Sink(
            (a) => switchWith(() => g(a)),
            (cause) => switchWith(() => f(cause)),
          ),
        ),
      )

      // Wait for the last fiber to finish
      const fiber = yield* $(RefS.get(ref))

      if (fiber) {
        yield* $(Fiber.join(fiber))
      }
    }),
  )
}

export function switchMatch<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (error: E) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return switchMatchCause(
    fx,
    (cause) => pipe(cause, Cause.failureOrCause, Either.match(f, failCause)),
    g,
  )
}

export function switchMatchCauseEffect<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  g: (a: A) => Effect.Effect<R3, E3, C>,
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return switchMatchCause(
    fx,
    (a) => fromEffect(f(a)),
    (b) => fromEffect(g(b)),
  )
}

export function switchMatchEffect<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (error: E) => Effect.Effect<R2, E2, B>,
  g: (a: A) => Effect.Effect<R3, E3, C>,
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return switchMatch(
    fx,
    (a) => fromEffect(f(a)),
    (b) => fromEffect(g(b)),
  )
}
