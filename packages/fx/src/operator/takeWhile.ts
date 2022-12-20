import { pipe } from '@fp-ts/data/Function'
import { Predicate, not } from '@fp-ts/data/Predicate'

import { Fx } from '../Fx.js'

import { skipUntil } from './skipUntil.js'

export function takeWhile<A>(predicate: Predicate<A>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, A> => pipe(fx, skipUntil(not(predicate)))
}
