import { pipe } from '@fp-ts/core/Function'
import { type Predicate, not } from '@fp-ts/core/Predicate'

import type { Fx } from '../Fx.js'

import { takeUntil } from './takeUntil.js'

export function takeWhile<A>(predicate: Predicate<A>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, A> => pipe(fx, takeUntil(not(predicate)))
}
