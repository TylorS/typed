import * as Effect from '@effect/io/Effect'
import type * as Fiber from '@effect/io/Fiber'
import * as Ref from '@effect/io/Ref/Synchronized'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'

export function exhaustMap<A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, B> => new ExhaustMapFx(fx, f)
}

class ExhaustMapFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, B>
  implements Fx<R | R2, E | E2, B>
{
  constructor(readonly fx: Fx<R, E, A>, readonly f: (a: A) => Fx<R2, E2, B>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, B>) {
    return pipe(
      Ref.make<Fiber.Fiber<never, unknown> | null>(null),
      Effect.flatMap((fiberRef) => {
        const resetRef = pipe(fiberRef, Ref.set<Fiber.Fiber<never, unknown> | null>(null))

        return withRefCounter(
          1,
          (counter) =>
            this.fx.run(
              Fx.Sink(
                (a) =>
                  pipe(
                    fiberRef,
                    Ref.updateEffect((fiber) =>
                      fiber
                        ? Effect.succeed(fiber)
                        : pipe(
                            counter.increment,
                            Effect.flatMap(() =>
                              Effect.forkScoped(
                                this.f(a).run(
                                  Fx.Sink(
                                    sink.event,
                                    (cause) => pipe(resetRef, Effect.zipRight(sink.error(cause))),
                                    pipe(resetRef, Effect.zipRight(counter.decrement)),
                                  ),
                                ),
                              ),
                            ),
                          ),
                    ),
                  ),
                sink.error,
                counter.decrement,
              ),
            ),
          sink.end,
        )
      }),
    )
  }
}
