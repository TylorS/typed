import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function tapCause<E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>) {
  return <R, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A> => new TapCauseFx(fx, f)
}

class TapCauseFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, A>
  implements Fx<R | R2, E | E2, A>
{
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A>) {
    return this.fx.run(
      Fx.Sink(
        sink.event,
        (cause) =>
          pipe(
            this.f(cause),
            Effect.foldCauseEffect(
              (cause2) => sink.error(Cause.sequential(cause, cause2)),
              () => sink.error(cause),
            ),
          ),
        sink.end,
      ),
    )
  }
}
