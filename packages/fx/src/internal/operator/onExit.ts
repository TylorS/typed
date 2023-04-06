import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { Effect, Exit } from '@typed/fx/internal/_externals'
import type { Context, Scope } from '@typed/fx/internal/_externals'

export const onExit: {
  <R, E, A, R2, B>(
    self: Fx<R, E, A>,
    f: (exit: Exit.Exit<E, unknown>) => Effect.Effect<R2, never, B>,
  ): Fx<R | R2, E, A>
  <E, R2, B>(f: (exit: Exit.Exit<E, unknown>) => Effect.Effect<R2, never, B>): <R, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, B>(
      self: Fx<R, E, A>,
      f: (exit: Exit.Exit<E, unknown>) => Effect.Effect<R2, never, B>,
    ) =>
      new OnExitFx(self, f).traced(trace),
)

export class OnExitFx<R, E, A, R2, B> extends BaseFx<R | R2, E, A> {
  readonly name = 'OnExit'

  constructor(
    readonly self: Fx<R, E, A>,
    readonly f: (exit: Exit.Exit<E, unknown>) => Effect.Effect<R2, never, B>,
  ) {
    super()
  }

  run(sink: Sink<E, A>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    return Effect.contextWithEffect((ctx: Context.Context<R | R2 | Scope.Scope>) =>
      this.self.run(
        Sink(
          sink.event,
          (cause) =>
            Effect.provideContext(
              Effect.flatMap(this.f(Exit.failCause(cause)), () => sink.error(cause)),
              ctx,
            ),
          () =>
            Effect.provideContext(
              Effect.flatMap(this.f(Exit.unit()), () => sink.end()),
              ctx,
            ),
        ),
      ),
    )
  }
}
