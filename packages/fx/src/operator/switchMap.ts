import { flow, pipe, identity, dual } from '@effect/data/Function'
import type { FlatMap } from '@effect/data/typeclass/FlatMap'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Ref from '@effect/io/Ref/Synchronized'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'
import type { FxTypeLambda } from '../typeclass/TypeLambda.js'

export const switchMap: FlatMap<FxTypeLambda>['flatMap'] = dual(
  2,
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>) => new SwitchMapFx(fx, f),
)

export const switchLatest: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> =
  switchMap(identity)

class SwitchMapFx<R, E, A, R2, E2, B>
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
                          pipe(
                            this.f(a).run(
                              Fx.Sink(
                                sink.event,
                                flow(
                                  Effect.unified((cause) =>
                                    Cause.isInterruptedOnly(cause)
                                      ? Effect.unit()
                                      : sink.error(cause),
                                  ),
                                  Effect.zipLeft(resetRef),
                                ),
                                pipe(counter.decrement, Effect.zipLeft(resetRef)),
                              ),
                            ),
                            Effect.forkScoped,
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
