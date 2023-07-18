import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'

import { Fx, Sink } from './Fx.js'
import { empty } from './empty.js'

export function mergeConcurrently<FXS extends ReadonlyArray<Fx<any, any, any>>>(
  ...fxs: FXS
): Fx<Fx.ResourcesOf<FXS[number]>, Fx.ErrorsOf<FXS[number]>, Fx.OutputOf<FXS[number]>> {
  if (fxs.length === 0) return empty()
  if (fxs.length === 1) return fxs[0]

  return Fx(<R2>(sink: Sink<R2, Fx.ErrorsOf<FXS[number]>, Fx.OutputOf<FXS[number]>>) =>
    Effect.gen(function* ($) {
      let currentIndex = 0
      const values = new Map<number, Fx.OutputOf<FXS[number]>>()
      const fibers: Fiber.Fiber<never, void>[] = []

      for (let i = 0; i < fxs.length; ++i) {
        fibers[i] = yield* $(
          Effect.fork(fxs[i].run(Sink((value) => onValue(i, value), sink.error))),
        )
      }

      function emit(index: number): Effect.Effect<R2, never, void> {
        if (index === currentIndex && values.has(index)) {
          return Effect.gen(function* ($) {
            // Send this value to the sink
            yield* $(sink.event(values.get(index) as Fx.OutputOf<FXS[number]>))

            // Interrupt the underlying Fiber
            yield* $(Fiber.interruptFork(fibers[index]))

            const next = ++currentIndex

            // If there's a value for the next index, emit it
            if (values.has(next)) {
              yield* $(emit(next))
            }
          })
        }

        return Effect.unit
      }

      function onValue(index: number, value: Fx.OutputOf<FXS[number]>) {
        return Effect.suspend(() => {
          values.set(index, value)

          return emit(index)
        })
      }

      yield* $(Fiber.joinAll(fibers))
    }),
  )
}
