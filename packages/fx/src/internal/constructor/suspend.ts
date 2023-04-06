import { methodWithTrace } from '@effect/data/Debug'
import type { Scope } from '@effect/io/Scope'

import { Effect } from '../_externals.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'

export const suspend: <R, E, A>(f: () => Fx<R, E, A>) => Fx<Exclude<R, Scope>, E, A> =
  methodWithTrace(
    (trace) =>
      <R, E, A>(f: () => Fx<R, E, A>): Fx<Exclude<R, Scope>, E, A> =>
        new SuspendFx(f).traced(trace),
  )

export class SuspendFx<R, E, A> extends BaseFx<Exclude<R, Scope>, E, A> {
  readonly name = 'Suspend'

  constructor(readonly f: () => Fx<R, E, A>) {
    super()
  }

  run(sink: Sink<E, A>): Effect.Effect<Exclude<R, Scope> | Scope, never, unknown> {
    return this.f().run(sink) as any
  }
}
