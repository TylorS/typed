import { methodWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { Cause, Either, Effect, Scope } from '@typed/fx/internal/externals'

export const flip: <R, E, A>(self: Fx<R, E, A>) => Fx<R, A, E> = methodWithTrace(
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>) =>
      new FlipFx(self).traced(trace),
)

export class FlipFx<R, E, A> extends BaseFx<R, A, E> {
  readonly name = 'Flip'

  constructor(readonly self: Fx<R, E, A>) {
    super()
  }

  run(sink: Sink<A, E>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.self.run(
      Sink(
        (value) => sink.error(Cause.fail(value)),
        (cause) =>
          pipe(
            Cause.failureOrCause(cause),
            Either.match(
              (failure) => sink.event(failure),
              (cause) => sink.error(cause),
            ),
          ),
        sink.end,
      ),
    )
  }
}
