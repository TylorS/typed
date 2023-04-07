import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import type { Cause, Scope } from '@typed/fx/internal/externals'
import { Effect } from '@typed/fx/internal/externals'

export const onDoneCause: {
  <R, E, A, R2, E2, B, R3, E3, C>(
    self: Fx<R, E, A>,
    onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    onSuccess: (value: unknown) => Effect.Effect<R3, E3, C>,
  ): Fx<R | R2 | R3, E | E2 | E3, A>

  <E, R2, E2, B, R3, E3, C>(
    onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    onSuccess: (value: unknown) => Effect.Effect<R3, E3, C>,
  ): <R, A>(self: Fx<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, A>
} = dualWithTrace(
  3,
  (trace) => (self, onFailure, onSuccess) =>
    new OnDoneCause(self, onFailure, onSuccess).traced(trace),
)

export class OnDoneCause<R, E, A, R2, E2, B, R3, E3, C> extends BaseFx<
  R | R2 | R3,
  E | E2 | E3,
  A
> {
  readonly name = 'OnDoneCause' as const

  constructor(
    readonly self: Fx<R, E, A>,
    readonly onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    readonly onSuccess: (value: unknown) => Effect.Effect<R3, E3, C>,
  ) {
    super()
  }

  run(sink: Sink<E | E2 | E3, A>): Effect.Effect<R | R2 | R3 | Scope.Scope, never, unknown> {
    const { onFailure, onSuccess, self } = this

    return pipe(
      self.observe(() => Effect.unit()),
      Effect.matchCauseEffect(
        (cause) => Effect.flatMap(onFailure(cause), () => sink.error(cause)),
        (value) => Effect.flatMap(onSuccess(value), sink.end),
      ),
      Effect.catchAllCause(sink.error),
    )
  }
}
