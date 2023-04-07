import { dualWithTrace } from '@effect/data/Debug'
import type { Scope } from '@effect/io/Scope'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Context } from '@typed/fx/internal/externals'
import { Cause, Effect, pipe } from '@typed/fx/internal/externals'

export const tapCause: {
  <R, E, A, R2, E2, B>(
    self: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, A>

  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): <R, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A>
} = dualWithTrace(2, (trace) => (self, f) => new TapCauseFx(self, f).traced(trace))

export class TapCauseFx<R, E, A, R2, E2, B> extends BaseFx<R | R2, E | E2, A> {
  readonly name = 'TapCause' as const

  constructor(
    readonly self: Fx<R, E, A>,
    readonly f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ) {
    super()
  }

  run(sink: Sink<E | E2, A>): Effect.Effect<R | R2 | Scope, never, unknown> {
    return Effect.contextWithEffect((ctx: Context.Context<R | R2 | Scope>) =>
      this.self.run(
        Sink(
          sink.event,
          (cause) =>
            pipe(
              this.f(cause),
              Effect.matchCauseEffect(
                (cause2) => sink.error(Cause.sequential(cause, cause2)),
                () => sink.error(cause),
              ),
              Effect.provideContext(ctx),
            ),
          sink.end,
        ),
      ),
    )
  }
}
