import * as Effect from '@effect/io/Effect'
import * as Ref from '@effect/io/Ref'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'

import { Fx } from '../Fx.js'
import { run } from '../run/run.js'

export function snapshot<R2, E2, B, A, C>(sampled: Fx<R2, E2, B>, f: (b: B, a: A) => C) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, C> => new SnapshotFx(fx, sampled, f)
}

export class SnapshotFx<R, E, A, R2, E2, B, C>
  extends Fx.Variance<R | R2, E | E2, C>
  implements Fx<R | R2, E | E2, C>
{
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly sampled: Fx<R2, E2, B>,
    readonly f: (b: B, a: A) => C,
  ) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, C>) {
    const { fx, sampled, f } = this

    return Effect.gen(function* ($) {
      const ref = yield* $(Ref.make<Option.Option<B>>(Option.none))

      yield* $(
        pipe(
          sampled,
          run((b) => pipe(ref, Ref.set(Option.some(b))), sink.error, Effect.unit()),
        ),
      )

      return yield* $(
        fx.run(
          Fx.Sink(
            (a) =>
              pipe(
                ref,
                Ref.get,
                Effect.flatMap(Option.match(Effect.unit, (b) => sink.event(f(b, a)))),
              ),
            sink.error,
            sink.end,
          ),
        ),
      )
    })
  }
}
