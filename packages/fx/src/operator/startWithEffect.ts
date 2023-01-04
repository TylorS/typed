import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function startWithEffect<R, E, A>(
  effect: Effect.Effect<R, E, A>,
): <R2, E2, B>(fx: Fx<R2, E2, B>) => Fx<R | R2, E | E2, A | B> {
  return (fx) => new StartWithEffectFx(fx, effect)
}

class StartWithEffectFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, A | B>
  implements Fx<R | R2, E | E2, A | B>
{
  constructor(readonly fx: Fx<R2, E2, B>, readonly effect: Effect.Effect<R, E, A>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A | B>) {
    return pipe(
      this.effect,
      Effect.matchCauseEffect(sink.error, (a) =>
        pipe(
          a,
          sink.event,
          Effect.flatMap(() => this.fx.run(sink)),
        ),
      ),
    )
  }
}
