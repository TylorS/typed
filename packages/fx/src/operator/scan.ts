import { pipe } from '@effect/data/Function'

import type { Fx } from '../Fx.js'

import { loop } from './loop.js'
import { startWith } from './startWith.js'

export function scan<B, A>(seed: B, f: (b: B, a: A) => B) {
  return <R, E>(self: Fx<R, E, A>): Fx<R, E, B> =>
    pipe(
      self,
      loop(seed, (b, a) => {
        const c = f(b, a)

        return [c, c]
      }),
      startWith(seed),
    )
}
