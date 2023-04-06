import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Effect, pipe, Scope } from '@typed/fx/internal/_externals'
import { filter } from '@typed/fx/internal/operator/filterMap'

export const since: {
  <R2, E2, B>(signal: Fx<R2, E2, B>): <R, E, A>(self: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, signal: Fx<R2, E2, B>): Fx<R | R2, E | E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(self: Fx<R, E, A>, signal: Fx<R2, E2, B>) =>
      new SinceFx(self, signal).traced(trace),
)

export class SinceFx<R, E, A, R2, E2, B> extends BaseFx<R | R2, E | E2, A> {
  readonly name = 'Since' as const

  constructor(readonly self: Fx<R, E, A>, readonly signal: Fx<R2, E2, B>) {
    super()
  }

  run(sink: Sink<E | E2, A>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    const { self, signal } = this

    return Effect.gen(function* ($) {
      let shouldRun = false

      yield* $(
        pipe(
          signal.observe(() =>
            Effect.flatMap(
              Effect.sync(() => (shouldRun = true)),
              Effect.interrupt,
            ),
          ),
          Effect.matchCauseEffect(sink.error, Effect.unit),
          Effect.forkScoped,
        ),
      )

      return yield* $(filter(self, () => shouldRun).run(sink))
    })
  }
}
