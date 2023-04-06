import { dualWithTrace } from '@effect/data/Debug'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Context, Scope } from '@typed/fx/internal/_externals'

export const onNonInterruptCause: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    A
  >
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      fx: Fx<R, E, A>,
      f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    ): Fx<R | R2, E | E2, A> =>
      new OnNonInterruptCauseFx(fx, f).traced(trace),
)

export class OnNonInterruptCauseFx<R, E, A, R2, E2, B> extends BaseFx<R | R2, E | E2, A> {
  readonly name = 'OnNonInterruptCause' as const

  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ) {
    super()
  }

  run(sink: Sink<E | E2, A>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    return Effect.contextWithEffect((ctx: Context.Context<R2>) =>
      this.fx.run(
        Sink(
          sink.event,
          (cause) =>
            Cause.isInterruptedOnly(cause)
              ? sink.end()
              : Effect.provideContext(Effect.catchAllCause(this.f(cause), sink.error), ctx),
          sink.end,
        ),
      ),
    )
  }
}
