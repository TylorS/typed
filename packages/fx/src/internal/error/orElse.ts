import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import type { Context, Scope } from '@typed/fx/internal/externals'
import { Effect } from '@typed/fx/internal/externals'

export const orElse: {
  <R, E, A, R1, E1, A1>(self: Fx<R, E, A>, that: () => Fx<R1, E1, A1>): Fx<R | R1, E | E1, A | A1>
  <R1, E1, A1>(that: () => Fx<R1, E1, A1>): <R, E, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R1, E | E1, A | A1>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R1, E1, A1>(self: Fx<R, E, A>, that: () => Fx<R1, E1, A1>) =>
      new OrElseFx(self, that).traced(trace),
)

class OrElseFx<R, E, A, R1, E1, A1> extends BaseFx<R | R1, E | E1, A | A1> {
  readonly name = 'OrElse' as const

  constructor(readonly self: Fx<R, E, A>, readonly that: () => Fx<R1, E1, A1>) {
    super()
  }

  run(sink: Sink<E | E1, A | A1>) {
    return Effect.contextWithEffect((ctx: Context.Context<R1 | Scope.Scope>) =>
      this.self.run(
        Sink(sink.event, () => Effect.provideContext(this.that().run(sink), ctx), sink.end),
      ),
    )
  }
}
