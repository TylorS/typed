import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import type { Context, Option, Scope } from '@typed/fx/internal/_externals'
import { Effect } from '@typed/fx/internal/_externals'

export const orElseOptional = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R1, E1, A1>(
      self: Fx<R, Option.Option<E>, A>,
      that: () => Fx<R1, Option.Option<E1>, A1>,
    ) =>
      new OrElseOptionalFx(self, that).traced(trace),
)

export class OrElseOptionalFx<R, E, A, R1, E1, A1> extends BaseFx<
  R | R1,
  Option.Option<E | E1>,
  A | A1
> {
  readonly name = 'OrElseOptional' as const

  constructor(
    readonly self: Fx<R, Option.Option<E>, A>,
    readonly that: () => Fx<R1, Option.Option<E1>, A1>,
  ) {
    super()
  }

  run(
    sink: Sink<Option.Option<E | E1>, A | A1>,
  ): Effect.Effect<R | R1 | Scope.Scope, never, unknown> {
    return Effect.contextWithEffect((ctx: Context.Context<R1 | Scope.Scope>) =>
      this.self.run(
        Sink(
          (a) => sink.event(a),
          () => Effect.provideContext(this.that().run(sink), ctx),
          sink.end,
        ),
      ),
    )
  }
}
