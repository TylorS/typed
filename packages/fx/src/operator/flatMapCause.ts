import { pipe } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'

export function flatMapCause<E, R2, E2, B>(
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B> {
  return (fx) => new FlatMapCauseFx(fx, f)
}

class FlatMapCauseFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, B>
  implements Fx<R | R2, E | E2, A | B>
{
  constructor(readonly fx: Fx<R, E, A>, readonly f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A | B>) {
    return withRefCounter(
      1,
      (counter) =>
        this.fx.run(
          Fx.Sink(
            sink.event,
            (cause) =>
              pipe(
                counter.increment,
                Effect.flatMap(() =>
                  this.f(cause).run(Fx.Sink(sink.event, sink.error, counter.decrement)),
                ),
                Effect.onError((cause) =>
                  Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                ),
                Effect.forkScoped,
              ),
            counter.decrement,
          ),
        ),
      sink.end,
    )
  }
}
