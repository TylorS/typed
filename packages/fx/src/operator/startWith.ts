import { pipe } from '@fp-ts/data/Function'

import type { Fx } from '../Fx.js'
import { succeed } from '../constructor/succeed.js'

import { continueWith } from './continueWith.js'

export function startWith<B>(value: B) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A | B> =>
    pipe(
      succeed(value),
      continueWith(() => fx),
    )
}
