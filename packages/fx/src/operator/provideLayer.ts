import { pipe } from '@effect/data/Function'
import type { Layer } from '@effect/io/Layer'

import type { Fx } from '../Fx.js'

import { provideSomeLayer } from './provideSomeLayer.js'

export function provideLayer<R2, E2, R>(layer: Layer<R2, E2, R>) {
  return <E, A>(self: Fx<R, E, A>): Fx<R2, E | E2, A> => pipe(self, provideSomeLayer(layer))
}
