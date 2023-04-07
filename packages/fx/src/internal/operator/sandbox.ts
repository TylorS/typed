import { methodWithTrace } from '@effect/data/Debug'
import * as Cause from '@effect/io/Cause'

import { Effect, Scope } from '../externals.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'

export const sandbox: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, Cause.Cause<E>, A> = methodWithTrace(
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>): Fx<R, Cause.Cause<E>, A> =>
      new SandboxFx(fx).traced(trace),
)

export class SandboxFx<R, E, A> extends BaseFx<R, Cause.Cause<E>, A> {
  readonly name = 'Sandbox'

  constructor(readonly fx: Fx<R, E, A>) {
    super()
  }

  run(sink: Sink<Cause.Cause<E>, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.fx.run(Sink(sink.event, (cause) => sink.error(Cause.fail(cause)), sink.end))
  }
}
