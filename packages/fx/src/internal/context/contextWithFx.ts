import { bodyWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Effect, Scope } from '@typed/fx/internal/_externals'
import type { Context } from '@typed/fx/internal/_externals'

export const contextWithFx: <R, R2, E2, A>(
  f: (context: Context.Context<R>) => Fx<R2, E2, A>,
) => Fx<R | R2, E2, A> = bodyWithTrace((trace) => (f) => new ContextWithFx(f).traced(trace))

export class ContextWithFx<R, R2, E2, A> extends BaseFx<R | R2, E2, A> {
  readonly name = 'ContextWithFx'

  constructor(readonly f: (context: Context.Context<R>) => Fx<R2, E2, A>) {
    super()
  }

  run(sink: Sink<E2, A>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    return Effect.contextWithEffect((context: Context.Context<R>) => this.f(context).run(sink))
  }
}
