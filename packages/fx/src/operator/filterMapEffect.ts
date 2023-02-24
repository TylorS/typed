import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

export function filterMapEffect<A, R2, E2, B>(
  predicate: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, B> => new FilterMapEffectFx(fx, predicate)
}

class FilterMapEffectFx<R, E, A, R2, E2, B>
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
    return this.fx.run(new FilterMapEffectSink(sink, this.predicate))
  }
}

class FilterMapEffectSink<R, E, A, R2, E2, B> implements Fx.Sink<R | R2, E, A> {
  constructor(
    readonly sink: Fx.Sink<R, E | E2, B>,
    readonly predicate: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ) {}

  event = (a: A) => {
    return pipe(
      this.predicate(a),
      Effect.matchCauseEffect(this.sink.error, Option.match(Effect.unit, this.sink.event)),
    )
  }

  error = this.sink.error
  end = this.sink.end
}
