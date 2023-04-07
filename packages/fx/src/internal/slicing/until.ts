import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Effect, Fiber, pipe, Scope } from '@typed/fx/internal/externals'

export const until: {
  <R2, E2, B>(signal: Fx<R2, E2, B>): <R, E, A>(self: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, signal: Fx<R2, E2, B>): Fx<R | R2, E | E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(self: Fx<R, E, A>, signal: Fx<R2, E2, B>) =>
      new UntilFx(self, signal).traced(trace),
)

export class UntilFx<R, E, A, R2, E2, B> extends BaseFx<R | R2, E | E2, A> {
  readonly name = 'Until' as const

  constructor(readonly self: Fx<R, E, A>, readonly signal: Fx<R2, E2, B>) {
    super()
  }

  run(sink: Sink<E | E2, A>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    const { self, signal } = this

    return Effect.gen(function* ($) {
      const fiber = yield* $(Effect.forkScoped(self.run(sink)))
      const signalFiber = yield* $(
        pipe(
          signal.observe(() => Effect.interrupt()),
          Effect.matchCauseEffect(sink.error, Effect.unit),
          Effect.forkScoped,
        ),
      )

      yield* $(Fiber.joinAll([fiber, signalFiber]))
    })
  }
}
