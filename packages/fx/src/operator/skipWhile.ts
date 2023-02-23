import { pipe } from '@effect/data/Function'
import { type Predicate, not } from '@effect/data/Predicate'

import type { Fx } from '../Fx.js'

import { skipUntil } from './skipUntil.js'

export function skipWhile<A>(predicate: Predicate<A>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, A> => pipe(fx, skipUntil(not(predicate)))
}
