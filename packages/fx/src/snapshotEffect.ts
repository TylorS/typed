import { Fx, Sink } from './Fx.js'
import { Effect, Fiber, Option, Ref } from './externals.js'

export function snapshotEffect<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  sampled: Fx<R2, E2, B>,
  f: (a: A, b: B) => Effect.Effect<R3, E3, C>,
): Fx<R | R2 | R3, E | E2 | E3, C> {
  return Fx((sink) =>
    Effect.gen(function* ($) {
      const current = yield* $(Ref.make(Option.none<B>()))

      const sampledFiber = yield* $(
        sampled.run(Sink((b) => Ref.set(current, Option.some(b)), sink.error)),
        Effect.fork,
      )

      yield* $(
        fx.run(
          Sink(
            (a) =>
              Effect.gen(function* ($) {
                const b = yield* $(Ref.get(current))

                if (Option.isSome(b)) {
                  yield* $(Effect.catchAllCause(f(a, b.value), sink.error))
                }
              }),
            sink.error,
          ),
        ),
      )

      yield* $(Fiber.interrupt(sampledFiber))
    }),
  )
}

export function snapshot<R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, A>,
  sampled: Fx<R2, E2, B>,
  f: (a: A, b: B) => C,
): Fx<R | R2, E | E2, C> {
  return snapshotEffect(fx, sampled, (a, b) => Effect.sync(() => f(a, b)))
}
