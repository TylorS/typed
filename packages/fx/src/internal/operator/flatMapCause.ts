import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { withRefCounter } from '@typed/fx/internal/RefCounter'
import type { Cause, Context, Scope } from '@typed/fx/internal/externals'
import { Effect } from '@typed/fx/internal/externals'

export const flatMapCause: {
  <E, R2, E2, B>(f: (e: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    A | B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(self: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Fx<R2, E2, B>) =>
      new FlatMapCauseFx(self, f).traced(trace),
)

export class FlatMapCauseFx<R, E, A, R2, E2, B> extends BaseFx<R | R2, E | E2, A | B> {
  readonly name = 'FlatMapCause' as const

  constructor(readonly self: Fx<R, E, A>, readonly f: (e: Cause.Cause<E>) => Fx<R2, E2, B>) {
    super()
  }

  run(sink: Sink<E | E2, A | B>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    return Effect.contextWithEffect((ctx: Context.Context<R | R2 | Scope.Scope>) =>
      withRefCounter(
        1,
        (counter) =>
          this.self.run(
            Sink(
              sink.event,
              (cause) =>
                pipe(
                  counter.increment,
                  Effect.flatMap(() => counter.refCounted(this.f(cause), sink, Effect.unit)),
                  Effect.forkScoped,
                  Effect.provideContext(ctx),
                ),
              () => Effect.provideContext(counter.decrement, ctx),
            ),
          ),
        sink.end,
      ),
    )
  }
}
