import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'

import { Fx } from '../Fx.js'

export const acquireUseRelease =
  <R, E, A>(acquire: Effect.Effect<R, E, A>) =>
  <R2>(release: (a: A) => Effect.Effect<R2, never, void>) =>
  <R3, E3, B>(use: (a: A) => Fx<R3, E3, B>): Fx<R | R2 | R3, E | E3, B> =>
    new AcquireUseReleaseFx(acquire, release, use)

class AcquireUseReleaseFx<R, E, A, R2, R3, E3, B>
  extends Fx.Variance<R | R2 | R3, E | E3, B>
  implements Fx<R | R2 | R3, E | E3, B>
{
  constructor(
    readonly acquire: Effect.Effect<R, E, A>,
    readonly release: (a: A) => Effect.Effect<R2, never, void>,
    readonly use: (a: A) => Fx<R3, E3, B>,
  ) {
    super()
  }

  run<R4>(sink: Fx.Sink<R4, E | E3, B>) {
    return pipe(
      Effect.acquireUseRelease(this.acquire, (a) => this.use(a).run(sink), this.release),
      Effect.matchCauseEffect(sink.error, Effect.succeed),
    )
  }
}
