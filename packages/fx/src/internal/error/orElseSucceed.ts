import { dualWithTrace } from '@effect/data/Debug'

import { Effect, Scope } from '../externals.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'

export const orElseSucceed: {
  <R, E, A, A2>(fx: Fx<R, E, A>, orFail: () => A2): Fx<R, E, A | A2>
  <A2>(orFail: () => A2): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | A2>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, A2>(fx: Fx<R, E, A>, orSucceed: () => A2) =>
      new OrElseSucceedFx(fx, orSucceed).traced(trace),
)

export class OrElseSucceedFx<R, E, A, A2> extends BaseFx<R, E, A | A2> {
  readonly name = 'OrElseSucceed' as const

  constructor(readonly fx: Fx<R, E, A>, readonly orSucceed: () => A2) {
    super()
  }

  run(sink: Sink<E, A | A2>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.fx.run(Sink(sink.event, () => sink.event(this.orSucceed()), sink.end))
  }
}
