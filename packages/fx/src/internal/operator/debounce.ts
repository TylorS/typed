import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { withRefCounter } from '@typed/fx/internal/RefCounter'
import type { Duration } from '@typed/fx/internal/externals'
import { Cause, Effect, Fiber, pipe, Scope } from '@typed/fx/internal/externals'

export const debounce: {
  <R, E, A>(self: Fx<R, E, A>, duration: Duration.Duration): Fx<R, E, A>
  (duration: Duration.Duration): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>, duration: Duration.Duration): Fx<R, E, A> =>
      new DebounceFx(self, duration).traced(trace),
)

export class DebounceFx<R, E, A> extends BaseFx<R, E, A> {
  readonly name = 'Debounce' as const

  constructor(readonly self: Fx<R, E, A>, readonly duration: Duration.Duration) {
    super()
  }

  run(sink: Sink<E, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return withRefCounter(
      1,
      (counter, scope) => {
        let scheduledFiber: Fiber.RuntimeFiber<never, unknown> | undefined

        return this.self.run(
          Sink(
            (a: A) =>
              Effect.suspend(() =>
                pipe(
                  scheduledFiber ? Fiber.interrupt(scheduledFiber) : counter.increment,
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  Effect.flatMap((_: unknown) =>
                    pipe(
                      sink.event(a),
                      Effect.delay(this.duration),
                      Effect.interruptible,
                      Effect.zipRight(counter.decrement),
                      Effect.uninterruptible,
                      Effect.onError((cause) =>
                        Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                      ),
                      Effect.forkScoped,
                      Effect.tap((fiber) =>
                        Effect.sync(() => {
                          scheduledFiber = fiber
                        }),
                      ),
                      Effect.provideService(Scope.Scope, scope),
                    ),
                  ),
                ),
              ),
            sink.error,
            () => Effect.provideService(counter.decrement, Scope.Scope, scope),
          ),
        )
      },
      sink.end,
    )
  }
}
