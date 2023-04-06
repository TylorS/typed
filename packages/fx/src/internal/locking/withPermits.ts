import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'
import type { Semaphore } from '@effect/io/Effect'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Effect, Scope } from '@typed/fx/internal/_externals'

export const withPermits: {
  <R, E, A>(fx: Fx<R, E, A>, semaphore: Semaphore, permits: number): Fx<R, E, A>
  (semaphore: Semaphore, permits: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>, semaphore: Semaphore, permits: number): Fx<R, E, A> =>
      new WithPermitsFx(fx, semaphore, permits).traced(trace),
)

export class WithPermitsFx<R, E, A> extends BaseFx<R, E, A> {
  readonly name = `WithPermits(${this.permits})`

  constructor(readonly fx: Fx<R, E, A>, readonly semaphore: Semaphore, readonly permits: number) {
    super()
  }

  run(sink: Sink<E, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    const andRelease = Effect.zipLeft(this.semaphore.release(this.permits))

    return pipe(
      this.semaphore.take(this.permits),
      Effect.flatMap(() =>
        this.fx.run(
          Sink(
            sink.event,
            (cause) => pipe(sink.error(cause), andRelease),
            () => pipe(sink.end(), andRelease),
          ),
        ),
      ),
    )
  }
}
