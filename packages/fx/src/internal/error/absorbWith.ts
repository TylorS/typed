import { dualWithTrace } from '@effect/data/Debug'
import * as Cause from '@effect/io/Cause'

import { Effect, Scope } from '../externals.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'

export const absorbWith: {
  <R, E, A>(fx: Fx<R, E, A>, f: (e: E) => unknown): Fx<R, unknown, A>
  <E>(f: (e: E) => unknown): <R, A>(fx: Fx<R, E, A>) => Fx<R, unknown, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>, f: (e: E) => unknown): Fx<R, unknown, A> =>
      new AbsorbWithFx(fx, f).traced(trace),
)

export class AbsorbWithFx<R, E, A> extends BaseFx<R, unknown, A> {
  readonly name = 'AbsorbWith'

  constructor(readonly fx: Fx<R, E, A>, readonly f: (e: E) => unknown) {
    super()
  }

  run(sink: Sink<unknown, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.fx.run(
      Sink(
        sink.event,
        (cause) => sink.error(Cause.fail(Cause.squashWith(cause, this.f))),
        sink.end,
      ),
    )
  }
}
