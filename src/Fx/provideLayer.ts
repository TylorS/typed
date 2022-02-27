import { get, Layer } from '@/Layer'
import { pipe } from '@/Prelude/function'

import { Fx } from './Fx'
import { provide } from './provide'

export function provideLayer<R2, E2, S>(layer: Layer<R2, E2, S>) {
  return <R, E, A>(fx: Fx<R & S, E, A>): Fx<R & R2, E | E2, A> =>
    Fx(function* () {
      return yield* pipe(fx, provide(yield* get(layer)))
    })
}

export function provideAllLayer<R2, E2, S>(
  layer: Layer<R2, E2, S>,
): <E, A>(fx: Fx<S, E, A>) => Fx<R2, E | E2, A> {
  return provideLayer(layer)
}
