import { Fx, Sink } from './Fx.js'
import { Effect, Fiber, RefS, Scope } from './externals.js'
import { fromEffect } from './fromEffect.js'

export function switchMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return Fx(<R3>(sink: Sink<R3, E | E2, B>) =>
    Effect.gen(function* ($) {
      const scope = yield* $(Scope.make())
      const ref = yield* $(RefS.make<Fiber.RuntimeFiber<never, void> | null>(null))
      const reset = RefS.set(ref, null)

      const switchEvent = (a: A) =>
        RefS.updateEffect(ref, (fiber) =>
          Effect.gen(function* ($) {
            if (fiber) {
              yield* $(Fiber.interrupt(fiber))
            }

            return yield* $(
              f(a).run(sink),
              Effect.zipLeft(reset),
              Effect.catchAllCause(sink.error),
              Effect.forkIn(scope),
            )
          }),
        )

      yield* $(
        Effect.gen(function* ($) {
          yield* $(fx.run(Sink(switchEvent, sink.error)))

          const fiber = yield* $(RefS.get(ref))

          // Wait for the last fiber to finish
          if (fiber) {
            yield* $(Fiber.join(fiber))
          }
        }),
        Effect.onExit((exit) => Scope.close(scope, exit)),
      )
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
