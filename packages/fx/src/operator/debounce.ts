import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { pipe } from '@fp-ts/core/Function'
import type * as Duration from '@effect/data/Duration'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'

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
              Effect.suspendSucceed(() =>
                pipe(
                  scheduledFiber ? Fiber.interrupt(scheduledFiber) : counter.increment,
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  Effect.flatMap((_: unknown) =>
                    pipe(
                      sink.event(a),
                      Effect.delay(duration),
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
