import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Ref from '@effect/io/Ref/Synchronized'
import { flow, pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'

export function switchMapCause<E, R2, E2, B>(
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B> {
  return (fx) => new SwitchMapCauseFx(fx, f)
}

export class SwitchMapCauseFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, A | B>
  implements Fx<R | R2, E | E2, A | B>
{
  constructor(readonly fx: Fx<R, E, A>, readonly f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A | B>) {
    return withRefCounter(
      0,
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
                sink.event,
                (cause) =>
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
                            this.f(cause).run(
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
                counter.decrement,
              ),
            )
          }),
        ),
      sink.end,
    )
  }
}
