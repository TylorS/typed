import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'

import { Fx } from '../Fx.js'

export function filterMapEffect<A, R2, E2, B>(
  predicate: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, B> => new FilterEffectFx(fx, predicate)
}

export class FilterEffectFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, B>
  implements Fx<R | R2, E | E2, B>
{
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly predicate: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E | E2, B>) {
    return this.fx.run(new FilterSink(sink, this.predicate))
  }
}

export class FilterSink<R, E, A, R2, E2, B> implements Fx.Sink<R | R2, E, A> {
  constructor(
    readonly sink: Fx.Sink<R, E | E2, B>,
    readonly predicate: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ) {}

  event = (a: A) => {
    return pipe(
      this.predicate(a),
      Effect.foldCauseEffect(this.sink.error, Option.match(Effect.unit, this.sink.event)),
    )
  }

  error = this.sink.error
  end = this.sink.end
}
