import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Cause, Effect, Scope } from '@typed/fx/internal/_externals'

export const orElseFail: {
  <R, E, A, E2>(fx: Fx<R, E, A>, orFail: () => E2): Fx<R, E2, A>
  <E2>(orFail: () => E2): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, E2>(fx: Fx<R, E, A>, orFail: () => E2) =>
      new OrElseFailFx(fx, orFail).traced(trace),
)

export class OrElseFailFx<R, E, A, E2> extends BaseFx<R, E2, A> {
  readonly name = 'OrElseFail' as const

  constructor(readonly fx: Fx<R, E, A>, readonly orFail: () => E2) {
    super()
  }

  run(sink: Sink<E2, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.fx.run(Sink(sink.event, () => sink.error(Cause.fail(this.orFail())), sink.end))
  }
}
