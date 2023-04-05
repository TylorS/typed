import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'
import { matchInterruptCause } from '../_internal/matchInterruptCause.js'

export function fromFxEffect<R, E, R2, E2, A>(
  effect: Effect.Effect<R, E, Fx<R2, E2, A>>,
): Fx<R | R2, E | E2, A> {
  return new FromFxEffect(effect)
}

class FromFxEffect<R, E, R2, E2, A>
  extends Fx.Variance<R | R2, E | E2, A>
  implements Fx<R | R2, E | E2, A>
{
  constructor(readonly effect: Effect.Effect<R, E, Fx<R2, E2, A>>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A>) {
    return pipe(
      this.effect,
      matchInterruptCause(
        sink.error,
        () => sink.end,
        (fx) => fx.run(sink),
      ),
    )
  }
}
