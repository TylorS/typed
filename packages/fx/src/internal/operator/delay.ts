import { dualWithTrace } from '@effect/data/Debug'
import type { Duration } from '@effect/data/Duration'
import * as Effect from '@effect/io/Effect'

import { Scope } from '../_externals.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'

export const delay: {
  <R, E, A>(fx: Fx<R, E, A>, duration: Duration): Fx<R, E, A>
  (duration: Duration): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>, duration: Duration): Fx<R, E, A> =>
      new DelayFx(fx, duration).traced(trace),
)

export class DelayFx<R, E, A> extends BaseFx<R, E, A> {
  readonly name = 'Delay' as const

  constructor(readonly fx: Fx<R, E, A>, readonly duration: Duration) {
    super()
  }

  run(sink: Sink<E, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.fx.run(
      Sink((a) => Effect.delay(sink.event(a), this.duration), sink.error, sink.end),
    )
  }
}
