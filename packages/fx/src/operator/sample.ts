import { identity, pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { snapshot } from './snapshot.js'

export function sample<R2, E2, B>(sampled: Fx<R2, E2, B>) {
  return <R, E, A>(sampler: Fx<R, E, A>): Fx<R | R2, E | E2, B> =>
    pipe(sampler, snapshot(sampled, identity))
}
