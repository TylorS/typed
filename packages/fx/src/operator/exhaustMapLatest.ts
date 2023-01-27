import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import type * as Fiber from '@effect/io/Fiber'
import * as Ref from '@effect/io/Ref/Synchronized'
import type { Scope } from '@effect/io/Scope'
import { pipe } from '@fp-ts/core/Function'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'

export function exhaustMapLatest<A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, B> => new ExhaustMapLatestFx(fx, f)
}

class ExhaustMapLatestFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, B>
  implements Fx<R | R2, E | E2, B>
{
  constructor(readonly fx: Fx<R, E, A>, readonly f: (a: A) => Fx<R2, E2, B>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, B>) {
    return pipe(
      Ref.make<Fiber.RuntimeFiber<never, unknown> | null>(null),
      Effect.zip(Ref.make<Fx<R2, E2, B> | null>(null)),
      Effect.flatMap(([fiberRef, nextFxRef]) => {
        return withRefCounter(
          1,
          (counter) => {
            const resetRef = pipe(fiberRef, Ref.set<Fiber.Fiber<never, unknown> | null>(null))

            const runNextFx: Effect.Effect<R3 | R2 | Scope, never, void> = pipe(
              nextFxRef,
              Ref.getAndSet<Fx<R2, E2, B> | null>(null),
              Effect.flatMap((fx) =>
                fx
                  ? pipe(
                      fiberRef,
                      Ref.updateEffect(() => runFx(fx)),
                    )
                  : counter.decrement,
              ),
            )

            const runFx = (
              fx: Fx<R2, E2, B>,
            ): Effect.Effect<R2 | R3 | Scope, never, Fiber.RuntimeFiber<never, unknown> | null> =>
              Effect.forkScoped(
                pipe(
                  fx.run(
                    Fx.Sink(
                      sink.event,
                      (e) => pipe(resetRef, Effect.zipRight(sink.error(e))),
                      pipe(resetRef, Effect.zipRight(runNextFx)),
                    ),
                  ),
                  Effect.onError((e) =>
                    Cause.isInterruptedOnly(e)
                      ? resetRef
                      : pipe(resetRef, Effect.zipRight(sink.error(e))),
                  ),
                ),
              )

            return this.fx.run(
              Fx.Sink(
                (a) =>
                  pipe(
                    fiberRef,
                    Ref.updateEffect((fiber) =>
                      fiber
                        ? pipe(
                            nextFxRef,
                            Ref.set<Fx<R2, E2, B> | null>(this.f(a)),
                            Effect.as(fiber),
                          )
                        : pipe(
                            counter.increment,
                            Effect.flatMap(() => runFx(this.f(a))),
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
      }),
    )
  }
}
