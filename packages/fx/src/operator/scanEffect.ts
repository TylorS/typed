import * as Effect from '@effect/io/Effect'
import * as TSemaphore from '@effect/stm/TSemaphore'
import { pipe } from '@fp-ts/data/Function'

import { Fx, Sink } from '../Fx.js'

export function scanEffect<R2, E2, B, A, R3, E3>(
  seed: Effect.Effect<R2, E2, B>,
  f: (b: B, a: A) => Effect.Effect<R3, E3, B>,
) {
  return <R, E>(self: Fx<R, E, A>): Fx<R | R2 | R3, E | E2 | E3, B> =>
    new ScanEffectFx(self, seed, f)
}

class ScanEffectFx<R, E, A, R2, E2, B, R3, E3>
  extends Fx.Variance<R | R2 | R3, E | E2 | E3, B>
  implements Fx<R | R2 | R3, E | E2 | E3, B>
{
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly seed: Effect.Effect<R2, E2, B>,
    readonly f: (b: B, a: A) => Effect.Effect<R3, E3, B>,
  ) {
    super()
  }

  run<R4>(sink: Sink<R4, E | E2 | E3, B>) {
    return pipe(
      this.seed,
      Effect.matchCauseEffect(sink.error, (acc) =>
        pipe(
          sink.event(acc),
          Effect.flatMap(() => this.fx.run(new ScanEffectSink(sink, acc, this.f))),
        ),
      ),
    )
  }
}

class ScanEffectSink<R, E, A, R2, E2, B, R3, E3, R4> implements Fx.Sink<R | R2 | R3 | R4, E, A> {
  protected acc: B = this.seed
  protected semaphore = TSemaphore.unsafeMake(1)

  constructor(
    readonly sink: Sink<R4, E | E2 | E3, B>,
    readonly seed: B,
    readonly f: (b: B, a: A) => Effect.Effect<R3, E3, B>,
  ) {}

  event = (a: A) => {
    return pipe(
      this.f(this.acc, a),
      Effect.matchCauseEffect(this.sink.error, (acc) => {
        this.acc = acc

        return this.sink.event(acc)
      }),
      TSemaphore.withPermit(this.semaphore),
    )
  }

  error = this.sink.error
  end = this.sink.end
}
