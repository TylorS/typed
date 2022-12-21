import * as Effect from '@effect/io/Effect'
import { Layer } from '@effect/io/Layer'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function provideSomeLayer<R2, E2, S>(layer: Layer<R2, E2, S>) {
  return <R, E, A>(self: Fx<R | S, E, A>): Fx<Exclude<R, S> | R2, E | E2, A> =>
    new ProvideSomeLayerFx(self, layer)
}

class ProvideSomeLayerFx<R, E, A, R2, E2, S>
  extends Fx.Variance<Exclude<R, S> | R2, E | E2, A>
  implements Fx<Exclude<R, S> | R2, E | E2, A>
{
  constructor(readonly self: Fx<R, E, A>, readonly layer: Layer<R2, E2, S>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A>) {
    return pipe(
      Effect.provideSomeLayer(this.layer)(this.self.run(sink)),
      Effect.foldCauseEffect(sink.error, Effect.succeed),
    )
  }
}
