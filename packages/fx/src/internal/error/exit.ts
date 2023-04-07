import { methodWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'
import * as Exit from '@effect/io/Exit'

import { Effect, Scope } from '../externals.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'

export const exit: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, never, Exit.Exit<E, A>> = methodWithTrace(
  (trace) => (fx) => new ExitFx(fx).traced(trace),
)

export class ExitFx<R, E, A> extends BaseFx<R, never, Exit.Exit<E, A>> {
  readonly name = 'Exit'

  constructor(readonly fx: Fx<R, E, A>) {
    super()
  }

  run(sink: Sink<never, Exit.Exit<E, A>>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.fx.run(
      Sink(
        (a) => pipe(a, Exit.succeed, sink.event),
        (e) => pipe(e, Exit.failCause, sink.event),
        sink.end,
      ),
    )
  }
}
