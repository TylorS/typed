import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Effect, Synchronized, Scope } from '@typed/fx/internal/externals'

export const summarized: {
  <R, E, A, R2, E2, B, C>(
    self: Fx<R, E, A>,
    summary: Effect.Effect<R2, E2, B>,
    f: (start: B, end: B) => C,
  ): Fx<R | R2, E | E2, readonly [C, A]>
  <R2, E2, B, C>(summary: Effect.Effect<R2, E2, B>, f: (start: B, end: B) => C): <R, E, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, readonly [C, A]>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, A, R2, E2, B, C>(
      self: Fx<R, E, A>,
      summary: Effect.Effect<R2, E2, B>,
      f: (start: B, end: B) => C,
    ): Fx<R | R2, E | E2, readonly [C, A]> => {
      return new SummarizedFx(self, summary, f).traced(trace)
    },
)

export class SummarizedFx<R, E, A, R2, E2, B, C> extends BaseFx<R | R2, E | E2, readonly [C, A]> {
  readonly name = 'Summarized'

  constructor(
    readonly self: Fx<R, E, A>,
    readonly summary: Effect.Effect<R2, E2, B>,
    readonly f: (start: B, end: B) => C,
  ) {
    super()
  }

  run(sink: Sink<E | E2, readonly [C, A]>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    const { f, self, summary } = this

    return Effect.matchCauseEffect(
      Effect.gen(function* ($) {
        const initial = yield* $(summary)
        const startRef = yield* $(Synchronized.make(initial))

        return yield* $(
          self.observe((a) =>
            Synchronized.updateEffect(startRef, (start) =>
              Effect.gen(function* ($) {
                const end = yield* $(summary)

                yield* $(Synchronized.set(startRef, end))
                yield* $(sink.event([f(start, end), a]))

                return end
              }),
            ),
          ),
        )
      }),
      sink.error,
      sink.end,
    )
  }
}
