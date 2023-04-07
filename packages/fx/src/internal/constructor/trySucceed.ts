import { methodWithTrace } from '@effect/data/Debug'
import { fail } from '@effect/io/Cause'

import { Effect, Scope } from '../externals.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'

export const trySuspend: <R, E, A>(f: () => Fx<R, E, A>) => Fx<R, unknown, A> = methodWithTrace(
  (trace) =>
    <R, E, A>(f: () => Fx<R, E, A>): Fx<R, unknown, A> =>
      new TrySuspendFx(f).traced(trace),
)

export class TrySuspendFx<R, E, A> extends BaseFx<R, unknown, A> {
  readonly name = 'TrySuspend'

  constructor(readonly f: () => Fx<R, E, A>) {
    super()
  }

  run(sink: Sink<unknown, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    try {
      return this.f().run(sink)
    } catch (e) {
      return sink.error(fail(e))
    }
  }
}
