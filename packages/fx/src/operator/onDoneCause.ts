import { pipe } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

export function onDoneCause<E, R2, E2, B, R3, E3, C>(
  onCause: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  onDone: Effect.Effect<R3, E3, C>,
) {
  return <R, A>(fx: Fx<R, E, A>): Fx<R | R2 | R3, E | E2 | E3, A> =>
    new OnDoneCauseFx(fx, onCause, onDone)
}

class OnDoneCauseFx<R, E, A, R2, E2, B, R3, E3, C>
  extends Fx.Variance<R | R2 | R3, E | E2 | E3, A>
  implements Fx<R | R2 | R3, E | E2 | E3, A>
{
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly onCause: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    readonly onDone: Effect.Effect<R3, E3, C>,
  ) {
    super()
  }

  run<R4>(sink: Fx.Sink<R4, E | E2 | E3, A>) {
    return this.fx.run(
      Fx.Sink(
        sink.event,
        (cause) =>
          pipe(
            this.onCause(cause),
            Effect.matchCauseEffect(
              (cause2) => sink.error(Cause.sequential(cause, cause2)),
              () => sink.error(cause),
            ),
          ),
        pipe(
          this.onDone,
          Effect.matchCauseEffect(sink.error, () => sink.end),
        ),
      ),
    )
  }
}
