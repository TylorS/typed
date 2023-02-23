import * as Either from '@effect/data/Either'
import { flow, pipe } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Ref from '@effect/io/Ref/Synchronized'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'
import { failCause } from '../constructor/failCause.js'

export function switchMatchCause<E, R2, E2, B, A, R3, E3, C>(
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C> {
  return (fx) => new SwitchMatchFx(fx, f, g)
}

export function switchMatchError<E, R2, E2, B, A, R3, E3, C>(
  f: (error: E) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C> {
  return switchMatchCause(flow(Cause.failureOrCause, Either.match(f, failCause)), g)
}

class SwitchMatchFx<R, E, A, R2, E2, B, R3, E3, C>
  extends Fx.Variance<R | R2 | R3, E2 | E3, B | C>
  implements Fx<R | R2 | R3, E2 | E3, B | C>
{
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    readonly g: (a: A) => Fx<R3, E3, C>,
  ) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E2 | E3, B | C>) {
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

            let firstError = true

            const handleError = Effect.suspendSucceed(() =>
              firstError ? ((firstError = false), Effect.asUnit(counter.decrement)) : Effect.unit(),
            )

            const runWith = <R>(fx: Fx<R, E2 | E3, B | C>) =>
              pipe(
                refFiber,
                Ref.updateEffect((fiber) =>
                  pipe(
                    fiber
                      ? Effect.asUnit(Fiber.interrupt(fiber))
                      : Effect.asUnit(counter.increment),
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    Effect.flatMap((_: unknown) =>
                      pipe(
                        fx.run(
                          Fx.Sink(
                            sink.event,
                            flow(sink.error, Effect.zipLeft(resetRef)),
                            pipe(counter.decrement, Effect.zipLeft(resetRef)),
                          ),
                        ),
                        Effect.onError((cause) =>
                          Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                        ),
                        Effect.forkScoped,
                      ),
                    ),
                  ),
                ),
              )

            return this.fx.run(
              Fx.Sink(
                (a) => runWith(this.g(a)),
                (a) =>
                  pipe(
                    runWith(this.f(a)),
                    Effect.flatMap(() => handleError),
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
