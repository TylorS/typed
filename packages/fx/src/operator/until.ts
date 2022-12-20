import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'

import { Fx } from '../Fx.js'

export function until<R2, E2, B>(signal: Fx<R2, E2, B>) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A> => new UntilFx(fx, signal)
}

export class UntilFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, A>
  implements Fx<R | R2, E | E2, A>
{
  constructor(readonly fx: Fx<R, E, A>, readonly signal: Fx<R2, E2, B>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A>) {
    const { fx, signal } = this

    return Effect.gen(function* ($) {
      const fiber = yield* $(Effect.forkScoped(fx.run(sink)))
      const signalFiber = yield* $(
        Effect.forkScoped(
          signal.run(Fx.Sink(() => Fiber.interrupt(fiber), sink.error, Fiber.interrupt(fiber))),
        ),
      )

      const x = yield* $(Fiber.join(fiber))

      yield* $(Fiber.interrupt(signalFiber))

      return x
    })
  }
}
