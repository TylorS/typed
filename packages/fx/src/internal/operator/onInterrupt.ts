import { dualWithTrace } from '@effect/data/Debug'
import * as HashSet from '@effect/data/HashSet'
import type * as FiberId from '@effect/io/Fiber/Id'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { Cause, Effect } from '@typed/fx/internal/_externals'
import type { Context, Scope } from '@typed/fx/internal/_externals'

export const onInterrupt: {
  <R, E, A, R2, B>(
    self: Fx<R, E, A>,
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, B>,
  ): Fx<R | R2, E, A>

  <R2, B>(f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, B>): <
    R,
    E,
    A,
  >(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, B>(
      self: Fx<R, E, A>,
      f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, B>,
    ) =>
      new OnInterruptCauseFx(self, f).traced(trace),
)

export class OnInterruptCauseFx<R, E, A, R2, B> extends BaseFx<R | R2, E, A> {
  readonly name = 'OnInterrupt'

  constructor(
    readonly self: Fx<R, E, A>,
    readonly f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, B>,
  ) {
    super()
  }

  run(sink: Sink<E, A>) {
    return Effect.contextWithEffect((ctx: Context.Context<R | R2 | Scope.Scope>) =>
      this.self.run(
        Sink(
          sink.event,
          (cause) => {
            const interruptors = Cause.interruptors(cause)

            if (HashSet.size(interruptors) === 0) {
              return Effect.flatMap(Effect.provideContext(this.f(interruptors), ctx), sink.end)
            } else {
              return sink.error(cause)
            }
          },
          sink.end,
        ),
      ),
    )
  }
}
