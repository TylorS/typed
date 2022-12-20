import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Ref from '@effect/io/Ref/Synchronized'
import { flow, pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'

export function switchMap<A, R2, E2, B>(
  f: (a: A) => Fx<R2, E2, B>,
): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B> {
  return (fx) => new SwitchMapFx(fx, f)
}

export class SwitchMapFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, B>
  implements Fx<R | R2, E | E2, B>
{
  constructor(readonly fx: Fx<R, E, A>, readonly f: (a: A) => Fx<R2, E2, B>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, B>) {
    return withRefCounter(
      1,
      (counter) =>
        pipe(
          Ref.make(null as Fiber.RuntimeFiber<never, unknown> | null),
          Effect.flatMap((refFiber) => {
            const resetRef = pipe(
              refFiber,
              Ref.set<Fiber.RuntimeFiber<never, unknown> | null>(null),
            )

            return this.fx.run(
              Fx.Sink(
                (a) =>
                  pipe(
                    refFiber,
                    Ref.updateEffect((fiber) =>
                      pipe(
                        fiber
                          ? Effect.asUnit(Fiber.interrupt(fiber))
                          : Effect.asUnit(counter.increment),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        Effect.flatMap((_: unknown) =>
                          Effect.forkScoped(
                            this.f(a).run(
                              Fx.Sink(
                                sink.event,
                                flow(sink.error, Effect.zipLeft(resetRef)),
                                pipe(counter.decrement, Effect.zipLeft(resetRef)),
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
            )
          }),
        ),
      sink.end,
    )
  }
}
