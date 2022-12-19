import { Fx } from '../Fx.js'

import { flatMapConcurrently } from './flatMapConcurrently.js'

export function concatMap<A, R2, E2, B>(
  f: (a: A) => Fx<R2, E2, B>,
): <R, E>(self: Fx<R, E, A>) => Fx<R | R2, E | E2, B> {
  return flatMapConcurrently(1, f)
}
