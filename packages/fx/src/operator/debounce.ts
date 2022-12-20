import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Schedule from '@effect/io/Schedule'
import { Scope } from '@effect/io/Scope'
import * as Duration from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'

const delayed = (duration: Duration.Duration) =>
  pipe(
    Schedule.once(),
    Schedule.delayed(() => duration),
  )

export function debounce(duration: Duration.Duration) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> => new DebounceFx(fx, duration)
}

export class DebounceFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
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

export class DebounceSink<R, E, A> implements Fx.Sink<R | Scope, E, A> {
  protected scheduledFiber: Fiber.RuntimeFiber<never, void> | undefined

  constructor(
    readonly sink: Fx.Sink<R, E, A>,
    readonly duration: Duration.Duration,
    readonly end: Effect.Effect<never, never, void>,
  ) {}

  event = (a: A) =>
    Effect.suspendSucceed(() =>
      pipe(
        this.scheduledFiber ? Fiber.interrupt(this.scheduledFiber) : Effect.unit(),
        Effect.flatMap(() =>
          pipe(
            this.sink.event(a),
            Effect.uninterruptible,
            Effect.scheduleForked(delayed(this.duration)),
            Effect.tap((fiber) =>
              Effect.sync(() => {
                this.scheduledFiber = fiber
              }),
            ),
          ),
        ),
      ),
    )

  error = this.sink.error
}
