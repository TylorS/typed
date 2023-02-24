import { dual, identity, pipe } from '@effect/data/Function'
import type { FlatMap } from '@effect/data/typeclass/FlatMap'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'
import type { FxTypeLambda } from '../index.js'

export const flatMap: FlatMap<FxTypeLambda>['flatMap'] = dual(
  2,
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>) => new FlatMapFx(fx, f),
)

export const flatten: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> =
  flatMap(identity)

class FlatMapFx<R, E, A, R2, E2, B>
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
        this.fx.run(
          Fx.Sink(
            (a) =>
              pipe(
                counter.increment,
                Effect.flatMap(() =>
                  this.f(a).run(Fx.Sink(sink.event, sink.error, counter.decrement)),
                ),
                Effect.onError((cause) =>
                  Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                ),
                Effect.forkScoped,
              ),
            sink.error,
            counter.decrement,
          ),
        ),
      sink.end,
    )
  }
}
