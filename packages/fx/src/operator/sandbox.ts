import { Cause } from '@effect/io/Cause'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { fail } from '../constructor/fail.js'

import { catchAllCause } from './catchAllCause.js'

export function sandbox<R, E, A>(fx: Fx<R, E, A>): Fx<R, Cause<E>, A> {
  return pipe(fx, catchAllCause(fail))
}
