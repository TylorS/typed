import * as Effect from '@effect/io/Effect'
import * as Ref from '@effect/io/Ref/Synchronized'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'

import { Fx } from '../Fx.js'
import { run } from '../run/run.js'

export function snapshotEffect<R2, E2, B, A, R3, E3, C>(
  sampled: Fx<R2, E2, B>,
  f: (b: B, a: A) => Effect.Effect<R3, E3, C>,
) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R | R2 | R3, E | E2 | E3, C> =>
    new SnapshotEffectFx(fx, sampled, f)
}

class SnapshotEffectFx<R, E, A, R2, E2, B, R3, E3, C>
  extends Fx.Variance<R | R2 | R3, E | E2 | E3, C>
  implements Fx<R | R2 | R3, E | E2 | E3, C>
{
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly sampled: Fx<R2, E2, B>,
    readonly f: (b: B, a: A) => Effect.Effect<R3, E3, C>,
  ) {
    super()
  }

  run<R4>(sink: Fx.Sink<R4, E | E2 | E3, C>) {
    const { fx, sampled, f } = this

    return Effect.gen(function* ($) {
      const ref = yield* $(Ref.make<Option.Option<B>>(Option.none))

      yield* $(
        pipe(
          sampled,
          run((b) => pipe(ref, Ref.set(Option.some(b))), sink.error, Effect.unit()),
          Effect.forkScoped,
        ),
      )

      return yield* $(
        fx.run(
          Fx.Sink(
            (a) =>
              pipe(
                ref,
                // Uses updateEffect to avoid concurrency issues
                Ref.updateEffect((option) =>
                  pipe(
                    option,
                    Option.match(
                      () => Effect.succeed(Option.none),
                      (b) =>
                        pipe(
                          f(b, a),
                          Effect.matchCauseEffect(sink.error, sink.event),
                          Effect.as(Option.some(b)),
                        ),
                    ),
                  ),
                ),
              ),
            sink.error,
            sink.end,
          ),
        ),
      )
    })
  }
}
