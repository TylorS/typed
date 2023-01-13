import { pipe } from '@fp-ts/data/Function'
import { type Predicate, not } from '@fp-ts/data/Predicate'

import type { Fx } from '../Fx.js'

import { takeUntil } from './takeUntil.js'

export function takeWhile<A>(predicate: Predicate<A>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, A> => pipe(fx, takeUntil(not(predicate)))
}
