import { pipe } from '@fp-ts/data/Function'
import { type Predicate, not } from '@fp-ts/data/Predicate'

import type { Fx } from '../Fx.js'

import { skipUntil } from './skipUntil.js'

export function skipWhile<A>(predicate: Predicate<A>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, A> => pipe(fx, skipUntil(not(predicate)))
}
