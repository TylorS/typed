import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Effect, Cause, Scope } from '@typed/fx/internal/externals'

export const mapCause: {
  <E, E2>(f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): <R, A>(self: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(self: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): Fx<R, E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    function mapCause<R, E, A, E2>(
      self: Fx<R, E, A>,
      f: (cause: Cause.Cause<E>) => Cause.Cause<E2>,
    ): Fx<R, E2, A> {
      return new MapCauseFx(self, f).traced(trace)
    },
)

export class MapCauseFx<R, E, A, E2> extends BaseFx<R, E2, A> {
  readonly name = 'MapCause'

  constructor(readonly self: Fx<R, E, A>, readonly f: (cause: Cause.Cause<E>) => Cause.Cause<E2>) {
    super()
  }

  run(sink: Sink<E2, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.self.run(Sink(sink.event, (cause) => sink.error(this.f(cause)), sink.end))
  }
}
