import type * as Duration from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'
import { matchInterruptCause } from '../_internal/matchInterruptCause.js'

export function debounce(duration: Duration.Duration) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> => new DebounceFx(fx, duration)
}

class DebounceFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly duration: Duration.Duration) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    const { fx, duration } = this

    return withRefCounter(
      1,
      (counter) => {
        let scheduledFiber: Fiber.RuntimeFiber<never, unknown> | undefined

        return fx.run(
          Fx.Sink(
            (a: A) =>
              Effect.suspend(() =>
                pipe(
                  scheduledFiber ? Fiber.interrupt(scheduledFiber) : counter.increment,
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  Effect.flatMap((_: unknown) =>
                    pipe(
                      sink.event(a),
                      Effect.delay(duration),
                      Effect.interruptible,
                      matchInterruptCause(
                        sink.error,
                        () => counter.decrement,
                        () => counter.decrement,
                      ),
                      Effect.uninterruptible,
                      Effect.forkScoped,
                      Effect.tap((fiber) =>
                        Effect.sync(() => {
                          scheduledFiber = fiber
                        }),
                      ),
                    ),
                  ),
                ),
              ),
            sink.error,
            counter.decrement,
          ),
        )
      },
      sink.end,
    )
  }
}
